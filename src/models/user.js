const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

/*Mongoose soporta middleware (código que se ejecuta antes o después de ejecutar ciertas funciones o procesos), y usaremos esta funcionalidad para implementar bcrypt*/
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true, // Solo un usuario registrado con un email
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    /* Si se guardan los tokens dentro del objeto user que maneja el cliente, y no como un objeto aparte que se envía desde el servidor (ver router/user/login), se pueden almacenar varios tokens relacionados con el usuario mientras esté logeado. Esto es interesante para asegurarse de que el usuario puedes deslogearse del ordenador (un cliente), pero permanecer logeado desde el móvil (otro)*/
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true // Permite rastrar fechas de creacion, actualizacion, etc.
});

// Usamos una 'virtual property' para establecer una relación con la colección Tasks
// No modifica el esquema, sino que informa a Mongoose de la relación entre esos dos modelos
// Dado que la relación es 1N, el user no necesita ninguna propiedad real para referirse a las tareas, por eso aquí usamos una propiedad virtual. La tarea sí que necesita un campo en el modelo para acoger al usuario propietario
userSchema.virtual('tasks', {
    ref: 'Task', // cotejar con el modelo de Tareas
    localField: '_id',
    foreignField: 'owner' //Campo  de la tarea donde se guardará la referencia del usuario
});

// Middleware propio para enviar a cliente solo ciertos datos (privacidad)
userSchema.methods.toJSON = function () {
    const user = this; // Como usamos this, no podemos usar funciones flecha
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar; // Por motivos de peso no enviamos el avatar

    return userObject; // Al convertirlo en Objecto, podemos elegir qué enviamos
}

// Asignamos una función propia a los métodos del Schema
// Se asigna a methods, y no a statics, porque no opera sobre el modelo User, sino sobre una instancia de ese modelo (el usuario logado)
userSchema.methods.generaTokenAutentificador = async function () {
    const user = this; // El documento (user) que se va a guardar en la BD
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET);
    console.log(token);
    user.tokens = user.tokens.concat({token});
    await user.save(); // registramos en la BD el usuario con el token
    return token
}

// Una función de login creada por nosotros que adjuntamos al Schema del usuario
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    if (!user) {
        throw new Error('Unable to log in');
    }

    // Si existe el usuario con ese email, verificamos el password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Unable to log in');
    }
    return user;
}

// Guardar los datos del modelo en Schemas nos permite utilizar middleware
// En este caso, esta operación tiene lugar antes de que se ejecute una consulta de tipo save()
// Son las que usaremos tanto al crear como al actualizar usuarios
userSchema.pre('save', async function (next) {
    // Si se crea un usuario, el password se "modifica". Lo mismo si se actualiza ese campo. En estos supuestos, debemos siempre encriptar el password, y lo hacemos con esta condición:
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next() // Si no llamamos a next, la aplicación se quedará colgada aquí
});

// Aprovechamos el middleware para escribir aquí una función de borrado de cascada de las tareas del usuario si decide eliminar su cuenta
userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({owner: user._id});
    next();
})


//Definición del modelo/"entidad" del Usuario
const User = mongoose.model('User', userSchema);

module.exports = User;

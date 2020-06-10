const mongoose = require('mongoose');
// Línea de conexión a la BD de MongoDB con parámetros básicos
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
});


/*const newTask = new Task({
    description: "Primera tarea de Mongoose",
    completed: true
});

newTask.save().then(() => {
    console.log('Tarea guardada');
}).catch((error) => console.log(error));*/

//Creación de un nuevo documento en la "tabla"
/*const newUser = new User({
    name: "      Antonia",
    email: 'MYEMAIL@ANTONIA.IO'
});

newUser.save().then(() => {
    console.log(newUser);
}).catch((error) => {
    console.log('Eror!', error)
});*/




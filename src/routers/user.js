const express = require('express');
const User = require('../models/user');
const router = new express.Router();
const auth = require('../middleware/auth'); // Middleware previo al login
const multer = require('multer'); // Gestión de archivos. Pueden crearse varias instancias
const sharp = require('sharp'); // Redimensión de imágenes
const {sendWelcomeEmail, sendCancellationEmail} = require('../emails/account');

// Instancia de Multer con validaciones para subir ficheros
const upload = multer({
    limits: {
        fileSize: 1000000 // Bytes = 1 Mb
    },
    // Tipos de archivos permitidos
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('You must upload an image type file'));
        }
        callback(undefined, true); // Callback: qué se hará al terminar de procesar el archivo. Se envía undefined para indicar que se ha terminado sin errores; de lo contrario se lanza un error
    }
});

//Endpoints para crear, consultar, actualizar y eliminar (CRUD) usuarios
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generaTokenAutentificador();
        res.status(201).send({user, token}); // Enviamos código 201 (petición creada) + el nuevo usuario
    } catch (error) { // Hay que capturar los errores para cada operacion await, o el resto no se ejecutarán
        res.status(400).send(error); //Se indica enviar un error 400 (petición del cliente mal formada)
    }
});

// Ruta para hacer login
router.post('/users/login', async (req, res) => {
    try {
        // Usamos una función creada por nosotros en el modelo del usuario
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generaTokenAutentificador();
        res.status(201).send({user, token}); //Enviamos al cliente solo los datos que queremos para mantener la privacidad. Ver en models/user el método 'toJSON'
    } catch (error) {
        res.status(400).send();
    }
});

router.post('/users/logout', auth, async (req, res) => {
    // Eliminamos el token que nos viene desde el middleware 'auth'
    // Para ello reescribimos la propiedad tokens de este usuario
    try {
        req.user.tokens = req.user.tokens.filter((token) =>
            token.token !== req.token
        );
        //Tras esto, el array con tokens se habrá modificado. Se mantendrán los tokens NO SEAN el mismo que se ha usado para la autenticación desde ese cliente, de forma que en ese array de tokens pueda haber más en caso de que el usuario se haya logeado desde otros clientes (y, por tanto, tenga otros tokens).
        await req.user.save();
        res.status(200).send();
    } catch (error) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    // Cierra todas las sesiones, eliminando en consecuencia todos los token activos
    try {
        req.user.tokens = [];
        await req.user.save();
        res.status(200).send();
    } catch (error) {
        res.status(500).send()
    }
});

// Se usa el middleware de autentificación
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body); // Devuelve un array de strings con claves de req.body, pero sin valores
    const allowedUpdates = ['name', 'email', 'password', 'age'];  //Establecemos lo que se puede actualizar
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update)) // Verifica cada clave sacada de req.body y se queda solo con las que coincidan con lo que hay en 'allowedUpdates'

    if (!isValidOperation)
        return res.status(400).send({error: 'Invalid updates!'});
    try {
        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save()
        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancellationEmail(req.user.name, req.user.email);
        res.status(200).send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
})

// Multer funciona como middleware de Express.
// Podemos añadir varios middlewares, pero en orden. Aquí, antes de subir nada, debemos estar autenticados
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer)
        .resize({width: 250, height: 250})
        .png()
        .toBuffer(); // La imagen original que se sube al buffer de multer es procesada por Sharp

    req.user.avatar = buffer //Nos permite guardar en la BD el archivo
    await req.user.save();
    res.send(); // La string 'userAvatar' se envia como parámetro de formulario desde el cliente (ver Postman)
}, (error, req, res, next) => {
    res.status(400).send({error: error.message});
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.status(200).send();
    } catch (error) {
        res.status(500).send(error);
    }
});

// Permitimos mostrar el avatar en el cliente (HTML)
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error();
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (error) {
        res.status(404).send();
    }
});

module.exports = router;

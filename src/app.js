const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();

app.use(express.json()); // urlEncoded tiene sentido al elegir cómo se pasan los parámetros en Postman, por ejemplo. Existen otras opciones, como JSON para pedir datos brutos en JSON
app.use(userRouter);  // Inserta el objeto con rutas de User en el servidor Express
app.use(taskRouter);


module.exports = app;
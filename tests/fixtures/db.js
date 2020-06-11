// * * * * * *
// Archivo que configura el acceso a la BD de prueba junto con una serie de útiles (usuario de pruebas) para ejecutar las suites de test
// * * * * * *

// Usuario que siempre se creará al iniciar los tests para log in, log out, etc.
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');

const userOneId = new mongoose.Types.ObjectId(); // Necesario para el uso de tokens. Se crea en variable independiente porque se usará en diferentes lugares
const userOne = {
    _id: userOneId,
    name: 'Alejandro de Pruebas',
    email: 'pruebas@probando.com',
    password: '56what!!',
    tokens: [{
        token: jwt.sign({_id: userOneId}, process.env.JWT_SECRET)
    }]
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
    _id: userTwoId,
    name: 'Alejandro Dos',
    email: 'pruebasDos@probando.com',
    password: 'myhouse099@@',
    tokens: [{
        token: jwt.sign({_id: userTwoId}, process.env.JWT_SECRET)
    }]
};

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Tarea de pruebas para tests',
    completed: false,
    owner: userOneId
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Tarea de pruebas segunda (para tests)',
    completed: true,
    owner: userOneId
}

const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Tarea de pruebas tercera (para tests)',
    completed: true,
    owner: userTwoId
}

const setupDatabase = async () => {
    await User.deleteMany(); // Eliminamos todos los usuarios de la BD de testing
    await Task.deleteMany();
    await new User(userOne).save(); // Dejamos añadido un usuario de pruebas para hacer login, logout, etc.
    await new User(userTwo).save();
    await new Task(taskOne).save();
    await new Task(taskTwo).save();
    await new Task(taskThree).save();
};


module.exports = {
    userOneId,
    userOne,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabase
}
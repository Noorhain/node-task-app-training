const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth'); // Para seleccionar el usuario que tiene las tareas
const router = new express.Router();

//Endpoints para crear, consultar, actualizar y eliminar (CRUD) tareas
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body, // convertimos el contenido de la request en un array de parámetros que asignaremos a task
        owner: req.user._id, // Aparte, guardamos el usuario autenticado en el campo owned del modelo 'task',
        ref: 'User'  // Se usa como referencia para vincularlo al usuario propietario de la tarea. Va en conjunción fon la función 'populate' ().
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(401).send(error);
    }
});

// Permitimos recibir, además de TODAS las tareas, un filtro por parámetros
// También implementamos la posibilidad de paginar/scroll y ordenación
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'; //Recordemos que se recibe una string desde la query, no un booleano
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':'); // Hemos elegido usar ':' porque nos apetece
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1; // -1 ordena partiendo de los más nuevos, y 1 a la inversa
    }

    try {
        await req.user.populate({
            path: 'tasks',
            // Usamos el objeto Match para añadir filtros de busqueda
            match,
            options: { //Paginación y filtros
                limit: parseInt(req.query.limit), // Del cliente recibimos un String, si lo hay,
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.status(200).send(req.user.tasks);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/tasks/:id', async (req, res) => {
    try {
        const task = await Task.findOne({_id, owner: req.user._id});
        if (!task)
            return res.status(404).send();
        res.status(200).send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body); // Devuelve un array de strings con claves de req.body, pero sin valores
    const allowedUpdates = ['description', 'completed'];  //Establecemos lo que se puede actualizar
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update)) // Verifica cada clave sacada de req.body y se queda solo con las que coincidan con lo que hay en 'allowedUpdates'

    if (!isValidOperation)
        return res.status(400).send({error: 'Invalid updates!'});

    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        if (!task)
            return res.status(404).send();

        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();
        res.status(200).send(task);
    } catch (error) {
        res.status(500).send(error);
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id});
        if (!task)
            return res.status(404).send();
        await task.remove();
        res.status(200).send('Task removed');
    } catch (error) {
        res.status(500).send(error);
    }
})

module.exports = router;

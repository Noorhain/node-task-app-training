// IMPORTANTE: para que los tests de diferentes suites no interfieran entre ellos (tenemos aquí tareas que requieren de que no se altere la BD, y los test de usuarios hacen eso constantemente), hay que modificar el script de testing en package.json, indicando el orden en el que deben realizarse con runInBand
const request = require('supertest'); // Con este paquete se puede hacer testing sin levantar un servidor
const app = require('../src/app');
const Task = require('../src/models/task');
const {
    userOneId,
    userOne,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabase
} = require('./fixtures/db');

// Se ejecuta antes de que empiecen los tests de esta suite
beforeEach(setupDatabase);

test('Should create task for user', async () => {
    const response = await request(app).post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'From my test',
        })
        .expect(201);

    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull();
    expect(task.completed).toBe(false);
});

test('Should get tasks', async () => {
    const response = await request(app).get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.length).toBe(2); // Asignamos al userOne dos tareas, que deberían aparecer al solicitarlas dentro de un array (un objeto Tarea para cada una de ellas)
});

test('Should not delete other user tasks', async () => {
    const response = await request(app).delete(`/tasks/${taskTwo._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)

    const task = await Task.findById(taskTwo._id);
    expect(task).not.toBeNull();
})
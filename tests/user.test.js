const request = require('supertest'); // Con este paquete se puede hacer testing sin levantar un servidor
const app = require('../src/app'); // Partimos del fichero 'app', y no del 'index.js', para no vernos afectados al señalar el puerto de escucha de la aplicación
const User = require('../src/models/user');
const { userOneId, userOne, setupDatabase} = require('./fixtures/db');

// Se ejecuta antes de que empiecen los tests de esta suite
beforeEach(setupDatabase);

// --- IMPORTANTE --- Por el momento, estos tests no funcionan 'urlencoded', sino solamente con envíos de json
test('Should signup a new user', async () => {
    // Utilizando supertest, enviamos una peticiòn post con un objeto del que esperamos una respuesta específica
    const response = await request(app).post('/users').send({
        name: 'Alejandro',
        email: 'hh@a.com',
        password: 'alejandro1234!$'
    }).expect(201);

    // Verificamos la creación del nuevo usuario y hacemos nuevas pruebas
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    // Pruebas sobre la respuesta
    expect(response.body).not.toMatchObject(userOne); // Podemos crear objetos ad hoc solo con las propiedades que queramos
});

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login')
        .send(userOne)
        .expect(201);

    const user = await User.findById(userOneId);
    expect(user.tokens[1].token).toBe(response.body.token);
});

test('Should not login non existing user', async () => {
    await request(app).post('/users/login')
        .send({
            email: userOne.email,
            password: 'alejandro1234!$'
        })
        .expect(400);
});

test('Should get profile for user', async () => {
    await request(app).get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`) // Es necesario enviar el token dentro de los headers de la petición HTTP
        .send()
        .expect(200);
});

test('Should not get profile for authenticated user', async () => {
    await request(app).get('/users/me')
        .send()
        .expect(401);
});

test('Should delete user account', async () => {
    const response = await request(app).delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
    const user = await User.findById(userOneId);
    expect(user).toBeNull();
});

test('Should not delete user account', async () => {
    await request(app).delete('/users/me')
        .send()
        .expect(401);
});

// Involucra el uso de 'fixtures', que son arreglos para que los entornos de pruebas puedan realizar ciertos tests
test('Should upload avatar image', async () => {
    await request(app).post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg') // Supertest permite añadir archivos. El primer parámetro debe ser el que utiliza el cliente, como Postman
        .expect(200);

    const user = await User.findById(userOneId);
    // Nota: no podemos comparar dos objetos con toBe ('===') dado que no comparten la misma referencia. Tenemos que usar en su lugar toEqual
    expect(user.avatar).toEqual(expect.any(Buffer)); // No tenemos nada con lo que compararlo, por lo que esperamos que, sea lo que sea, se trate de un Buffer de datos
});

test('Should update valid user fields', async() => {
    await request(app).patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            'name': 'Adalberto Albares'
        })
        .expect(200);
    const user = await User.findById(userOneId);
    expect(user.name).toEqual('Adalberto Albares');
});

test('Should update valid user fields', async() => {
    await request(app).patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            'what': 'Adalberto Albares'
        })
        .expect(400);
});


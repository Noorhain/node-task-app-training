// Ver el archivo app.js. Por motivos de testing, se utilizará ese fichero como punto de partida para las pruebas, mientras que se partirá de este otro para el uso habitual de la app

const app = require('./app');
const port = process.env.PORT; // ver config/variables de entorno; ver también los scripts de package.json

app.listen(port, () => {
    console.log('Server is up on port ' + port)
});
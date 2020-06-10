const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Recibimos los parámetros del usuario en la BD
const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'lozanoalejandro.tech@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with it!`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'lozanoalejandro.tech@gmail.com',
        subject: 'Farewell!',
        text: `We're sorry to see you leaving, ${name}, but that's how life is, so... Goodbye!`
    })
}

// Como exportamos diversas funciones, esta sintaxis hace que las introduzcamos en un objeto
module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}

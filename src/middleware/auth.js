const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', ''); // Se coteja con el header enviado desde Postman. Debemos eliminar el antecedente 'Bearer ' y dejar solo el contenido del token
        const decoded = jwt.verify( token, '' +
            process.env.JWT_SECRET );
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token }); // Comprobamos tanto la ID del user como que ese token sigue sienvo válido (sigue formando parte del documento de ese user)
        if(!user)
            throw new Error();

        // Enviamos el token como parte de la petición para que se pueda usar, por ejemplo, en el logout
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({error: 'Please authenticate'});
    }
}

module.exports = auth;


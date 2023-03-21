const admin = require('../config/firebase-config')

const authMiddleware = (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized');
    }

    const idToken = authorization.split('Bearer ')[1];
    admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
            req.user = decodedToken;
            next();
        })
        .catch((error) => {
            console.error(error);
            res.status(401).send('Unauthorized');
        });
};

module.exports = authMiddleware;
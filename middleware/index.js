const admin = require('../config/firebase-config')

class Middleware{
    async decodeToken(req, res, next){
        const token = req.headers.Authorization;
        try {
            const decodeValue = await admin.auth().verifyIdToken(token);
            if (decodeValue) {
                return next();
            } else {
                return res.status(401).json({message: "Unauthorized"});
            }
        }catch (err){
            return res.status(500).json({message: "Internal error : "+err.message});
        }
    }
}

module.exports = new Middleware();
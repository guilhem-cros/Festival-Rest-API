const admin = require("firebase-admin");
const credential = require("../serviceAccount.json");

admin.initializeApp({
    credential : admin.credential.cert(credential)
});

module.exports = admin;

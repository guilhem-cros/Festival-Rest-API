const mongoose = require("mongoose");

/**
 * Schema of a benevole object into the DB
 * @type {*}
 */
const BenevoleSchema = mongoose.Schema({
    nom:{
        type: String,
        required: true
    },
    prenom:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Benevoles', BenevoleSchema, "Benevoles");
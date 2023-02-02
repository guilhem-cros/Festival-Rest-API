const mongoose = require("mongoose");

/**
 * Schema of a jeu object into the DB
 * @type {*}
 */
const JeuSchema = mongoose.Schema({
    nom:{
        type: String,
        required: true
    },
    type:{
        type: {_id: String, nom: String},
        required: true
    },
});

module.exports = mongoose.model('Jeux', JeuSchema, "Jeux");
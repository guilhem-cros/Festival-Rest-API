const mongoose = require("mongoose");

/**
 * Schema of a typeJeu object into the DB
 * @type {*}
 */
const TypeJeuSchema = mongoose.Schema({
    nom:{
        type: String,
        required: true
    }
});

module.exports = mongoose.model('TypeJeux', TypeJeuSchema, "TypeJeux");
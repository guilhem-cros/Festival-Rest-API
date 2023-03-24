const mongoose = require("mongoose");
/**
 * Schema of a zone object into the DB
 * @type {*}
 */
const ZoneSchema = mongoose.Schema({
    nom:{
        type: String,
        required: true
    },
    benevoles:{
        type: [{}],
        required: true
    },
    jeux:{
        type: [{}],
        required: true
    },
    nbBenevNecessaire: {
        type: Number,
        default : 10,
        required: true
    }
});

module.exports = mongoose.model('Zones', ZoneSchema, "Zones");
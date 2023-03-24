const mongoose = require('mongoose');


const festivalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    beginningDate: { type: String, required: true },
    days: { type: [{}], required: true },
    zones: { type: [{}], required: true},
});

festivalSchema.methods.close = function() {
    this.isActive = false;
};

const Festival = mongoose.model('Festivals', festivalSchema);

module.exports = Festival;
const mongoose = require('mongoose');

const festivalDaySchema = new mongoose.Schema({
    name: { type: String, required: true },
    openingTime: { type: String, required: true },
    closingTime: { type: String, required: true },
});

const FestivalDay = mongoose.model('FestivalDays', festivalDaySchema);

module.exports = FestivalDay;
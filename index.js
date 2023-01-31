const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv/config");

app.use(bodyParser.json());

const benevolesRoutes = require("./routes/benevoles/routes.js");

app.use('/benevoles', benevolesRoutes);
app.get('/', (req, res)=>{
    res.send("on home");
})

//Connecting to DB
mongoose.set("strictQuery", true);
mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser : true});

app.listen(5000);
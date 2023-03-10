const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const middleware = require("./middleware/index")
require("dotenv/config");

app.use(cors());
app.use(bodyParser.json());
app.use(middleware.decodeToken)

const benevolesRoutes = require("./routes/benevoles/routes.js");
const jeuxRoutes = require("./routes/jeux/routes.js");
const typeJeuxRoutes = require("./routes/typeJeux/routes.js");
const zonesRoutes = require("./routes/zones/routes.js");

app.use('/benevoles', benevolesRoutes);
app.use('/jeux', jeuxRoutes);
app.use('/typeJeux', typeJeuxRoutes);
app.use('/zones', zonesRoutes);

//Connecting to DB
mongoose.set("strictQuery", true);
mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser : true});

app.listen(5000);
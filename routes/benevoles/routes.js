const express = require("express");
const router = express.Router();
const Benevole = require("../../models/Benevole");

router.get('/by_zone', (req, res)=>{
    res.send("on no");
});

/**
 * Route getting every benevoles available in the DB
 */
router.get("/", async (req, res)=>{
    try{
        const benevoles = await Benevole.find();
        res.json(benevoles);
    } catch (err){
        res.status(500).json({message: err});
    }
})

/**
 * Route saving a new benevole into the DB
 */
router.post('/', async(req, res)=>{
    const benevole = new Benevole({
        nom: req.body.nom,
        prenom: req.body.prenom,
        email: req.body.email
    });
    try{
        const savedBenevole = await benevole.save();
        res.status(200).json(savedBenevole);
    } catch (err){
        res.status(500).json({message: err})
    }
})

module.exports = router;
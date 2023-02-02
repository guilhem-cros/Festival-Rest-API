const express = require("express");
const router = express.Router();
const Zone = require("../../models/Zone");

/**
 * Route getting every zones available in the DB
 */
router.get("/", async (req, res)=>{
    try{
        const zones = await Zone.find();
        res.json(zones);
    } catch (err){
        res.status(500).json({message: err});
    }
})

/**
 * Route used to add a benevole to a specified zone
 */
router.patch("/addBenevoleTo/:zoneId", async (req, res)=>{
    try{
        const toUpdateZone = await Zone.findById(req.params.zoneId);
        const benevoles = toUpdateZone.benevoles;
        benevoles.push({heureDebut: req.params.heureDebut, heureFin: req.params.heureFin, benevole:req.params.benevole});
        const updatedZone = await Zone.updateOne(
            {_id: req.params.zoneId},
            {
                $set:{
                    benevoles:benevoles
                }
            }
        )
        res.json(updatedZone);
    }catch (err){
        res.status(404).json({message : err});
    }
})

router.patch("/addJeuTo/:zoneId", async (req, res)=>{
    try{
        const toUpdateZone = await Zone.findById(req.params.zoneId);
        const jeux = toUpdateZone.jeux;
        jeux.push(req.params.jeu);
        const updatedZone = await Zone.updateOne(
            {_id: req.params.zoneId},
            {
                $set:{
                    jeux:jeux
                }
            }
        )
        res.json(updatedZone);
    }catch (err){
        res.status(404).json({message : err});
    }
})




module.exports = router;
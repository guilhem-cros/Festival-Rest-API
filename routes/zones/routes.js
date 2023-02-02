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
/*
router.patch("/addBenevoleTo/:zoneId", async (req, res)=>{
    try{
        const toUpdateZone = await Zone.findById(req.params.zoneId);
        toUpdateZone.push
        const updatedZone = await Zone.updateOne(
            {_id: req.params.zoneId},
            {
                $set:{
                    benevoles:
                }
            }
        )
    }catch (err){
        res.status(404).json({message : err});
    }
})
*/

module.exports = router;
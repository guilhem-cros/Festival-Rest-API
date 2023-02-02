const express = require("express");
const TypeJeu = require("../../models/TypeJeu");
const router = express.Router();

/**
 * Route getting every TypeJeu available in the DB
 */
router.get("/", async (req, res)=>{
    try{
        const jeux = await TypeJeu.find();
        res.json(jeux);
    } catch (err){
        res.status(500).json({message: err});
    }
})

/**
 * Route getting a TypeJeu by a specified ID
 */
router.get("/:typeId", async(req, res)=>{
    try{
        const type = await TypeJeu.findById(req.params.typeId);
        res.json(type);
    }catch (err){
        res.status(404).json({message: err});
    }
})

module.exports = router;
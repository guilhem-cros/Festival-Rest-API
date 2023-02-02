const express = require("express");
const router = express.Router();
const Jeu = require("../../models/Jeu");

/**
 * Route getting every Jeu available in the DB
 */
router.get("/", async (req, res)=>{
    try{
        const jeux = await Jeu.find();
        res.json(jeux);
    } catch (err){
        res.status(500).json({message: err});
    }
})

/**
 * Route getting a Jeu by a specified ID
 */
router.get("/:jeuId", async(req, res)=>{
    try{
        const jeu = await Jeu.findById(req.params.jeuId);
        res.json(jeu);
    }catch (err){
        res.status(404).json({message: err});
    }
})

/**
 * Route saving a new Jeu into the DB
 */
router.post('/', async(req, res)=>{
    const jeu = new Jeu({
        nom: req.body.nom,
        type: req.body.type
    });
    try{
        const savedJeu = await jeu.save();
        res.status(200).json(savedJeu);
    } catch (err){
        res.status(500).json({message: err})
    }
})

/**
 * Route updating a single Jeu by its id
 */
router.patch('/:jeuId', async (req, res)=>{
    try {
        const updatedJeu = await Jeu.updateOne(
            {_id: req.params.jeuId},
            {$set: {nom: req.body.nom, type: req.body.type}}
        );
        res.json(updatedJeu);
    }catch (err){
        res.status(404).json({message:err});
    }
})

/**
 * Route deleting a Jeu by its id
 */
router.delete('/:jeuId', async (req, res)=>{
    try{
        const removedJeu = await Jeu.deleteOne({_id: req.params.jeuId});
        res.json(removedJeu);
    } catch (err){
        res.status(404).json({message: err});
    }
})

module.exports = router;
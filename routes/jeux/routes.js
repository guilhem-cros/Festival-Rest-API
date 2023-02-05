const express = require("express");
const router = express.Router();
const Jeu = require("../../models/Jeu");
const Zone = require("../../models/Zone");


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
        await removeJeuFromZones(req.params.jeuId);
        res.json(removedJeu);
    } catch (err){
        res.status(404).json({message: err});
    }
})


/**
 * Remove a jeu by its id from every zone containing it
 * @param idJeu the id of the jeu removed
 * @returns {Promise<void>}
 */
async function removeJeuFromZones(idJeu){
    try{
        const zones = await Zone.find();
        for(const zone of zones) {
            let i = 0;
            while (i < zone.jeux.length && zone.jeux[i].localeCompare(idJeu) != 0) {
                i++;
            }
            if (i < zone.jeux.length) {
                zone.jeux.splice(i, 1);
                await Zone.updateOne({_id: zone._id}, {$set: {jeux: zone.jeux}})
            }
        }
    }catch (err){
        console.log(err)
    }
}

module.exports = router;
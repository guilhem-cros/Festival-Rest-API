const express = require("express");
const router = express.Router();
const Benevole = require("../../models/Benevole");
const Zone = require("../../models/Zone");


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
 * Route getting a benevole by a specified ID
 */
router.get("/:beneId", async(req, res)=>{
    try{
        const benevole = await Benevole.findById(req.params.beneId);
        res.json(benevole);
    }catch (err){
        res.status(404).json({message: err});
    }
})

/**
 * Route getting every affectation of a specified benevole
 * on every zone
 */
router.get("/:beneId/zones", async(req, res)=>{
    try{
        const zones = await Zone.find({},{ jeux:0});
        const creneauxBenev = [];
        for (const zone of zones) {
            for (const benev of zone.benevoles) {
                if (benev.benevole.localeCompare(req.params.beneId) == 0) {

                    console.log(zone.nom)
                    creneauxBenev.unshift({"zoneId": zone._id, "zoneName": zone.nom, "heureDebut": benev.heureDebut, "heureFin": benev.heureFin})
                }
            }
        }
        res.json(creneauxBenev)
    }catch (err){
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

/**
 * Route updating a single benevole by its id
 */
router.patch('/:beneId', async (req, res)=>{
    try {
        const updatedBenevole = await Benevole.updateOne(
            {_id: req.params.beneId},
            {$set: {nom: req.body.nom, prenom: req.body.prenom, email: req.body.email}}
        );
        res.json(updatedBenevole);
    }catch (err){
        res.status(404).json({message:err});
    }
})

/**
 * Route deleting a benevole by its id
 */
router.delete('/:beneId', async (req, res)=>{
    try{
        const removedBenevole = await Benevole.deleteOne({_id: req.params.beneId});
        await removeBenevFromZones(req.params.beneId);
        res.json(removedBenevole);
    } catch (err){
        res.status(404).json({message: err});
    }
})

/**
 * Remove a benevole by its id from every zone containing it
 * @param idB the id of the benevole removed
 * @returns {Promise<void>}
 */
async function removeBenevFromZones(idB){
    try{
        const zones = await Zone.find();
        for (const zone of zones){
            for (const benev of zone.benevoles){
                if(benev.benevole.localeCompare(idB)==0){
                    zone.benevoles.remove(benev);
                }
            }
            await Zone.updateOne({_id: zone._id}, {$set: {benevoles: zone.benevoles}});
        }
    }catch (err){
        console.log(err)
    }
}

module.exports = router;
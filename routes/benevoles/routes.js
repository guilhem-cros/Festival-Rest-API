const express = require("express");
const benevolesRoutes = express.Router();
const Benevole = require("../../models/Benevole");
const Zone = require("../../models/Zone")
const authMiddleware = require('../../middleware/index');
const {checkIfAvailableBenev} = require("../zones/routes")


benevolesRoutes.use(authMiddleware);

/**
 * Route getting a benevole by its firebase uid
 */
benevolesRoutes.get("/byUID/:uid", async(req, res)=>{
    try{
        const benevole = await Benevole.find({firebaseID: req.params.uid})
        res.json(benevole[0]);
    }catch (err){
        res.status(404).json({message: err});
    }
})

/**
 * Route getting every benevoles available in the DB
 */
benevolesRoutes.get("/", async (req, res)=>{
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
benevolesRoutes.get("/:beneId", async(req, res)=>{
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
benevolesRoutes.get("/:beneId/zones", async(req, res)=>{
    try{
        const zones = await Zone.find({},{ jeux:0});
        const searchedBenev = await Benevole.findById(req.params.beneId);
        const creneauxBenev = [];
        for (const zone of zones) {
            for (const benev of zone.benevoles) {
                if (benev.benevole.localeCompare(req.params.beneId) === 0) {
                    creneauxBenev.unshift({"benevole": searchedBenev,"zoneId": zone._id, "zoneName": zone.nom, "heureDebut": benev.heureDebut, "heureFin": benev.heureFin})
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
benevolesRoutes.post('/', async(req, res)=>{
    const benevole = new Benevole({
        nom: req.body.nom,
        prenom: req.body.prenom,
        email: req.body.email,
        dispo : [],
        firebaseID : req.user.uid
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
benevolesRoutes.patch('/:beneId', async (req, res)=>{
    try {
        if(await isConnected(req.params.beneId, req.user.uid) || await isAdmin(req.params.beneId)){
            const updatedBenevole = await Benevole.updateOne(
                {_id: req.params.beneId},
                {$set: {nom: req.body.nom, prenom: req.body.prenom}}
            );
            res.json(updatedBenevole);
        }else{
            res.status(401).json({message: "Unauthorized"});
        }
    }catch (err){
        res.status(404).json({message:err});
    }
})

/**
 * Adding a slot to a benev
 */
benevolesRoutes.patch('/:beneId/addSlot', async(req, res)=>{
    try{
        if(await isConnected(req.params.beneId, req.user.uid)){
            if(await slotDoesntExist(req.params.beneId, req.body.heureDebut, req.body.heureFin) && await checkIfAvailableBenev(req.params.beneId, req.body.heureDebut, req.body.heureFin)) {
                const benevole = await Benevole.findById(req.params.beneId);
                const slots = benevole.dispo;
                slots.push([req.body.heureDebut, req.body.heureFin]);
                slots.sort((a, b) => new Date(a[0]) - new Date(b[0]));
                const updatedBenevole = await Benevole.updateOne(
                    {_id: req.params.beneId},
                    {$set: {dispo: slots}}
                );
                res.json(updatedBenevole);
            }else{
                res.status(502).json({message: "Le créneau ou une partie de celui-ci est déjà utilisé par ce bénévole"});
            }
        }else{
            res.status(401).json({message: "Unauthorized"})
        }
    }catch (err){
        res.status(500).json({message: err})
    }
})

/**
 * Removing a slot from a benev
 */
benevolesRoutes.patch('/:beneId/removeSlot', async(req, res)=>{
    try{
        if(await isConnected(req.params.beneId, req.user.uid)) {
            const benevole = await Benevole.findById(req.params.beneId);
            const slots = benevole.dispo;
            const updatedSlots = slots.filter(item => {
                return item.indexOf(req.body.heureDebut) === -1
            });
            const updatedBenevole = await Benevole.updateOne(
                {_id: req.params.beneId},
                {$set: {dispo: updatedSlots}}
            );
            res.json(updatedBenevole);
        }else {
            res.status(401).json({message: "Unauthorized"});
        }
    }catch (err){
        res.status(500).json({message: err})
    }
})

/**
 * Route deleting a benevole by its id
 */
benevolesRoutes.delete('/:beneId', async (req, res)=>{
    try{
        if(await isAdmin(req.user.uid)) {
            const removedBenevole = await Benevole.deleteOne({_id: req.params.beneId});
            await removeBenevFromZones(req.params.beneId);
            res.json(removedBenevole);
        }else{
            res.status(401).json({message: "Unauthorized"})
        }
    } catch (err){
        res.status(404).json({message: err});
    }
})


async function isConnected(idB, uid){
    try {
        const benev = await Benevole.findById(idB);
        return benev.firebaseID.localeCompare(uid) === 0;
    }catch (err){
        console.log(err);
        return false;
    }
}

async function isAdmin(idB){
    try {
        const benev = await Benevole.findById(idB);
        return benev.admin;
    }catch (err){
        console.log(err)
        return false;
    }
}

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
                if(benev.benevole.localeCompare(idB)===0){
                    zone.benevoles.remove(benev);
                }
            }
            await Zone.updateOne({_id: zone._id}, {$set: {benevoles: zone.benevoles}});
        }
    }catch (err){
        console.log(err)
    }
}

async function slotDoesntExist(idB, debut, fin){
    if(new Date(debut)>new Date(fin)){ //si l'h de debut est supérieure à l"h de fin
        return false
    }
    try {
        let bool = true;
        let i = 0;
        const dateDebut = new Date(debut);
        const dateFin = new Date(fin);
        const benev = await Benevole.findById(idB);
        while (bool && i < benev.dispo.length) {
            const hDebut = new Date(benev.dispo[i][0]);
            const hFin = new Date(benev.dispo[i][1]);
            if (( hDebut=== dateDebut && hFin === dateFin) ||
                (dateDebut > hDebut && dateDebut < hFin) ||
                (dateFin > hDebut && dateFin < hFin) ||
                (dateDebut<=hDebut && dateFin>=hFin )){
                bool = false;
            }
            i++;
        }
        return bool;
    } catch (err) {
        return false;
    }
}

module.exports = benevolesRoutes;
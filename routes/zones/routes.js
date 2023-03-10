const express = require("express");
const router = express.Router();
const Zone = require("../../models/Zone");
const Benevole = require("../../models/Benevole");
const Jeu = require("../../models/Jeu");

/**
 * Route getting every zones available in the DB
 */
router.get("/", async (req, res)=>{
    try{
        const zones = await Zone.find();
        for(const zone of zones){
            zone.benevoles = await fillBenevole(zone.benevoles);
            zone.jeux = await fillJeux(zone.jeux)
        }
        res.json(zones);
    } catch (err){
        res.status(500).json({message: err});
    }
})

/**
 * Route getting every name and id of the zones
 */
router.get("/names/", async (req, res)=>{
    try{
        const names = await Zone.find({}, {benevoles:0, jeux:0});
        res.json(names);
    }catch (err){
        res.status(500).json({message : err});
    }
})

/**
 * Route getting a single zone by its id
 */
router.get("/:zoneId", async (req, res)=>{
    try{
        const zone = await Zone.findById(req.params.zoneId);
        zone.benevoles = await fillBenevole(zone.benevoles);
        zone.jeux = await fillJeux(zone.jeux)
        res.json(zone);
    }catch (err){
        res.status(404).json({message: err});
    }
})

/**
 * Route used to add a benevole to a specified zone
 * The fully benevole object has to be added and also the
 * hours of working on this zone
 */
router.patch("/addBenevoleTo/:zoneId", async (req, res)=>{
    if(await checkIfAvailableBenev(req.body.benevole, req.body.heureDebut, req.body.heureFin)) {
        try {
            const toUpdateZone = await Zone.findById(req.params.zoneId);
            const benevoles = toUpdateZone.benevoles;
            benevoles.push({heureDebut: req.body.heureDebut, heureFin: req.body.heureFin, benevole: req.body.benevole});
            benevoles.sort((benev1, benev2) => new Date(benev1.heureDebut) - new Date(benev2.heureDebut));
            const updatedZone = await Zone.updateOne(
                {_id: req.params.zoneId},
                {
                    $set: {
                        benevoles: benevoles
                    }
                }
            )
            res.json(updatedZone);
        } catch (err) {
            res.status(404).json({message: err});
        }
    }else{
        res.status(400).json({message:"Le cr??neau saisi ne peut ??tre rempli pour ce b??n??vole."})
    }
})

/**
 * Route used to add a jeu to a specified zone
 */
router.patch("/addJeuTo/:zoneId", async (req, res)=>{
    try{
        if(!await checkJeuInZone(req.body.jeu, req.params.zoneId)) {
            const toUpdateZone = await Zone.findById(req.params.zoneId);
            const jeux = toUpdateZone.jeux;
            jeux.push(req.body.jeu);
            const updatedZone = await Zone.updateOne(
                {_id: req.params.zoneId},
                {
                    $set: {
                        jeux: jeux
                    }
                }
            )
            res.json(updatedZone);
        } else{
            res.status(406).json({message : "Ce jeu est d??j?? associ?? ?? la zone"});
        }
    }catch (err){
        res.status(404).json({message : err});
    }
})

/**
 * Route used to remove a game from a specified zone
 * Game is removed by its id
 */
router.patch("/removeJeuFrom/:zoneId", async (req, res)=>{
    try{
        const toUpdateZone = await Zone.findById(req.params.zoneId);
        console.log(1);
        const jeux = toUpdateZone.jeux;
        removeJeuByIdFrom(jeux, req.body.id);
        const updatedZone = await Zone.updateOne({_id: req.params.zoneId}, {$set:{jeux:jeux}})
        res.json(updatedZone);
    }catch (err){
        res.status(404).json({message: err});
    }
})

router.patch("/removeBenevFrom/:zoneId",async(req, res)=>{
    try{
        const toUpdateZone = await Zone.findById(req.params.zoneId);
        const benevoles = toUpdateZone.benevoles;
        removeBenevFrom(benevoles, req.body.id, req.body.heureDebut);
        const updatedZone = await Zone.updateOne({_id: req.params.zoneId}, {$set: {benevoles:benevoles}});
        res.json(updatedZone);
    }catch (err){
        res.status(404).json({message: err});
    }
})



/**Other methods*/

/**
 * Fill the benevoles list with a complete object benevole
 * using its id from the id stocked
 * @param arr the array containing benevoles'id, heureDebut and heureFin
 * @returns {Promise<*[]>} the array of benevoles corresponding to the id
 */
async function fillBenevole(arr){
    try {
        let benevoles = [];
        for(const value of arr){
            const benevole = await Benevole.findById(value.benevole);
            benevoles.push({heureDebut : value.heureDebut, heureFin :value.heureFin, benevole : benevole})
        }
        return benevoles
    }catch (err){
        return [];
    }
}

/**
 * Fill the jeux list with complete jeu object using
 * ids from the ids stocked
 * @param arr the array of jeux ids
 * @returns {Promise<*[]>} the array of jeux objects corresponding to ids
 */
async function fillJeux(arr){
    try{
        let jeux= [];
        for(const value of arr){
            const jeu = await Jeu.findById(value);
            jeux.push(jeu)
        }
        return jeux;
    }catch (err){
        return[];
    }
}

/**
 * Remove the object (jeu) from an array for which _id is equals to specified id
 * @param arr the array in which object is removed
 * @param id String, the id of the object to  remove
 */
function removeJeuByIdFrom(arr, id){
    let removed=false;
    let i = 0;
    while(!removed && i<arr.length){
        if(arr[i].localeCompare(id)==0){
            arr.remove(arr[i]);
            removed=true;
        }
        i++;
    }
}

/**
 * Remove a benevole from an array for which _id equals to a specified if and
 * hour of work equals to a specified hour
 * @param arr the array in which object is removed
 * @param id String, the id of the benevole to remove
 * @param heureDebut the hour of beginning
 */
function removeBenevFrom(arr, id, heureDebut){
    let removed = false;
    let i=0;
    while(!removed && i<arr.length){
        if(arr[i].benevole.localeCompare(id)==0 && heureDebut==arr[i].heureDebut){
            arr.remove(arr[i]);
            removed=true;
        }
        i++;
    }
}

/**
 * Check if a Jeu is already in a zone
 * @param id_jeu the id of the checked jeu
 * @param id_zone the id of the zone in which jeu is searched
 * @returns {Promise<boolean>} true if the jeu is in the zone, false if not
 */
async function checkJeuInZone(id_jeu, id_zone){
    const zone = await Zone.findById(id_zone);
    let ret = false;
    zone.jeux.forEach(jeu => {
        if (jeu.localeCompare(id_jeu)==0) {
            ret = true;
        }
    })
    return ret;
}

/**
 * Check on every zone if a benevole is available between 2 specified hours
 * @param id the id of the benevole checked
 * @param heureDebut the begin hour checked
 * @param heureFin the end hour checked
 * @returns {Promise<boolean>} true if benevole is available, false if not
 */
async function checkIfAvailableBenev(id, heureDebut, heureFin) {
    if(new Date(heureDebut)>new Date(heureFin)){ //si l'h de debut est sup??rieure ?? l"h de fin
       return false
    }
    try {
        let bool = true;
        let i = 0;
        const debut = new Date(heureDebut);
        const fin = new Date(heureFin);
        const zones = await Zone.find();
        while (bool && i < zones.length) {
            let j = 0;
            while (bool && j < zones[i].benevoles.length) {
                const benevoles = zones[i].benevoles;
                if (benevoles[j].benevole.localeCompare(id) == 0) {
                    const hDebut = new Date(benevoles[j].heureDebut);
                    const hFin = new Date(benevoles[j].heureFin);
                    if (( hDebut== debut && hFin == fin) ||
                        (debut > hDebut && debut < hFin) ||
                        (fin > hDebut && fin < hFin) ||
                        (debut<=hDebut && fin>=hFin )){
                        bool = false;
                    }
                }
                j++;
            }
            i++;
        }
        return bool;
    } catch (err) {
        return false;
    }
}

module.exports = router;
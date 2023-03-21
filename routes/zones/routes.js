const express = require("express");
const zonesRoutes = express.Router();
const Zone = require("../../models/Zone");
const Benevole = require("../../models/Benevole");
const Jeu = require("../../models/Jeu");
const authMiddleware = require("../../middleware");

zonesRoutes.use(authMiddleware);

/**
 * Route getting every zones available in the DB
 */
zonesRoutes.get("/", async (req, res)=>{
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
zonesRoutes.get("/names/", async (req, res)=>{
    try{
        const names = await Zone.find({}, {benevoles:0, jeux:0});
        res.json(names);
    }catch (err){
        res.status(500).json({message : err});
    }
})

/**
 * Route getting every benevole available on a specified time slot
 */
zonesRoutes.post("/availableBenevoles/", async(req, res)=>{
    try {
        const benevoles = await Benevole.find();
        const availableBenevs = [];
        for (const benev of benevoles) {
            if (await hasFreeSlot(benev._id, req.body.heureDebut, req.body.heureFin)) {
                availableBenevs.push(benev);
            }
        }
        res.json(availableBenevs);
    }catch (err){
        res.status(500).json({message: err});
    }
})

/**
 * Route getting a single zone by its id
 */
zonesRoutes.get("/:zoneId", async (req, res)=>{
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
zonesRoutes.patch("/addBenevoleTo/:zoneId", async (req, res)=>{
    if(await isAdmin(req.user.uid)) {
        if (await checkIfAvailableBenev(req.body.benevole, req.body.heureDebut, req.body.heureFin) && await hasFreeSlot(req.body.benevole, req.body.heureDebut, req.body.heureFin)) {
            try {
                const toUpdateZone = await Zone.findById(req.params.zoneId);
                if(await countBenevOnZone(req.params.zoneId, req.body.heureDebut, req.body.heureFin)<toUpdateZone.nbBenevNecessaire) {
                    const benevoles = toUpdateZone.benevoles;
                    benevoles.push({
                        heureDebut: req.body.heureDebut,
                        heureFin: req.body.heureFin,
                        benevole: req.body.benevole
                    });
                    benevoles.sort((benev1, benev2) => new Date(benev1.heureDebut) - new Date(benev2.heureDebut));
                    await removeSlotFrom(req.body.benevole, req.body.heureDebut, req.body.heureFin);
                    const updatedZone = await Zone.updateOne(
                        {_id: req.params.zoneId},
                        {
                            $set: {
                                benevoles: benevoles
                            }
                        }
                    )
                    res.json(updatedZone);
                }else{
                    res.status(406).json({message: "Ce créneau est déjà suffisament rempli pour la zone saisie"})                }
            } catch (err) {
                res.status(404).json({message: err});
            }
        } else {
            res.status(400).json({message: "Le créneau saisi ne peut être rempli pour ce bénévole."})
        }
    }else{
        res.status(401).json({message : "Unauthorized"});
    }
})

/**
 * Route used to add a jeu to a specified zone
 */
zonesRoutes.patch("/addJeuTo/:zoneId", async (req, res)=>{
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
            res.status(406).json({message : "Ce jeu est déjà associé à la zone"});
        }
    }catch (err){
        res.status(404).json({message : err});
    }
})

/**
 * Route used to remove a game from a specified zone
 * Game is removed by its id
 */
zonesRoutes.patch("/removeJeuFrom/:zoneId", async (req, res)=>{
    try{
        const toUpdateZone = await Zone.findById(req.params.zoneId);
        const jeux = toUpdateZone.jeux;
        removeJeuByIdFrom(jeux, req.body.id);
        const updatedZone = await Zone.updateOne({_id: req.params.zoneId}, {$set:{jeux:jeux}})
        res.json(updatedZone);
    }catch (err){
        res.status(404).json({message: err});
    }
})

zonesRoutes.patch("/removeBenevFrom/:zoneId",async(req, res)=>{
    if(await isAdmin(req.user.uid)) {
        try {
            const toUpdateZone = await Zone.findById(req.params.zoneId);
            const benevoles = toUpdateZone.benevoles;
            removeBenevFrom(benevoles, req.body.id, req.body.heureDebut);
            const updatedZone = await Zone.updateOne({_id: req.params.zoneId}, {$set: {benevoles: benevoles}});
            res.json(updatedZone);
        } catch (err) {
            res.status(404).json({message: err});
        }
    } else{
        res.status(401).json({message: "Unauthorized"})
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
        if(arr[i].localeCompare(id)===0){
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
        if(arr[i].benevole.localeCompare(id)===0 && heureDebut===arr[i].heureDebut){
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
        if (jeu.localeCompare(id_jeu)===0) {
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
    if(new Date(heureDebut)>new Date(heureFin)){ //si l'h de debut est supérieure à l"h de fin
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
                if (benevoles[j].benevole.localeCompare(id) === 0) {
                    const hDebut = new Date(benevoles[j].heureDebut);
                    const hFin = new Date(benevoles[j].heureFin);
                    if (( hDebut=== debut && hFin === fin) ||
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

async function removeSlotFrom(beneId, debut, fin){
    try {
        let i=0;
        let found = false;
        const dateDebut = new Date(debut);
        const dateFin = new Date(fin);
        const benev = await Benevole.findById(beneId);
        while (!found && i < benev.dispo.length) {
            const hDebut = new Date(benev.dispo[i][0]);
            const hFin = new Date(benev.dispo[i][1]);
            if ((hDebut === dateDebut && hFin === dateFin) ||
                (dateDebut > hDebut && dateDebut < hFin) ||
                (dateFin > hDebut && dateFin < hFin) ||
                (dateDebut <= hDebut && dateFin >= hFin)) {
                found = true;
                let deb = benev.dispo[i][0];
                let end = benev.dispo[i][1];
                const slots = benev.dispo;
                slots.splice(i,1);
                await Benevole.updateOne(
                    {_id: beneId},
                    {$set: {dispo: slots}}
                )
                await addMissingSlotTo(beneId, deb, end, debut, fin);
            }
            i++;
        }
    }catch (err) {
        console.log(err)
    }
}

async function addMissingSlotTo(idBene, hDebutOld, hFinOld, hDebutNew, hFinNew){
    const benevole = await Benevole.findById(idBene);
    const slots = benevole.dispo;
    if(new Date(hDebutNew)>new Date(hDebutOld)){
        slots.push([hDebutOld, hDebutNew])
    }
    if(new Date(hFinNew)<new Date(hFinOld)){
        slots.push([hFinNew, hFinOld])
    }
    slots.sort((a, b) => new Date(a[0]) - new Date(b[0]));
    await Benevole.updateOne(
        {_id: idBene},
        {$set: {dispo: slots}}
    );
}

/**
 * Check if a benev has a slot corresponding to a specified slot
 * @param idBenev id of the benev
 * @param hDebut beginning our of the slot to take
 * @param hFin ending hour of the slot to take
 * @returns {Promise<boolean>}
 */
async function hasFreeSlot(idBenev, hDebut, hFin){
    if(new Date(hDebut)>new Date(hFin)){ //si l'h de debut est supérieure à l"h de fin
        return false
    }
    try{
        let bool = false;
        let i = 0;
        const dateDebut = new Date(hDebut);
        const dateFin = new Date(hFin);
        const benev = await Benevole.findById(idBenev);
        while (!bool && i < benev.dispo.length) {
            const hDebut = new Date(benev.dispo[i][0]);
            const hFin = new Date(benev.dispo[i][1]);
            if (dateDebut >= hDebut && dateFin <= hFin){
                bool = true;
            }
            i++;
        }
        return bool;
    }catch (err){
        console.log(err);
        return false;
    }
}

async function isAdmin(uid){
    try {
        const benevole = await Benevole.find({firebaseID: uid});
        return benevole.admin;
    }catch (err){
        console.log(err)
        return false;
    }
}

async function countBenevOnZone(idZone, hDebut, hFin){
    try{
        let count = 0;
        let alreadyCountedBenev = [];
        const debut = new Date(hDebut);
        const fin = new Date(hFin);
        const zone = await Zone.findById(idZone);
        zone.benevoles.forEach(benevole=>{
            const hDebut = new Date(benevole.heureDebut);
            const hFin = new Date(benevole.heureFin);
            if ((hDebut === debut && hFin === fin) ||
                (debut > hDebut && debut < hFin) ||
                (fin > hDebut && fin < hFin) ||
                (debut <= hDebut && fin >= hFin)) {
                if(!alreadyCountedBenev.includes(benevole.benevole)){
                    count++;
                    alreadyCountedBenev.push(benevole.benevole);
                }
            }
        })
        return count;
    }catch (err){
        console.log(err);
        return 0;
    }
}

module.exports = {zonesRoutes, checkIfAvailableBenev};
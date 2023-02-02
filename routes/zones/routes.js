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
 * Route getting a single zone by its id
 */
router.get("/:zoneId", async (req, res)=>{
    try{
        const zone = await Zone.findById(req.params.zoneId);
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
    if(await checkIfAvailableBenev(req.body.benevole._id, req.body.heureDebut, req.body.heureFin)) {
        try {
            const toUpdateZone = await Zone.findById(req.params.zoneId);
            const benevoles = toUpdateZone.benevoles;
            benevoles.push({heureDebut: req.body.heureDebut, heureFin: req.body.heureFin, benevole: req.body.benevole});
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
        res.status(400).json({message:"Le créneau saisi ne peut être rempli pour ce bénévole."})
    }
})

/**
 * Route used to add a jeu to a specified zone
 */
router.patch("/addJeuTo/:zoneId", async (req, res)=>{
    try{
        const toUpdateZone = await Zone.findById(req.params.zoneId);
        const jeux = toUpdateZone.jeux;
        jeux.push(req.body.jeu);
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

/**
 * Route used to remove a game from a specified zone
 * Game is removed by its id
 */
router.patch("/removeJeuFrom/:zoneId", async (req, res)=>{
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
 * Remove the object (jeu) from an array for which _id is equals to specified id
 * @param arr the array in which object is removed
 * @param id String, the id of the object to  remove
 */
function removeJeuByIdFrom(arr, id){
    let removed=false;
    let i = 0;
    while(!removed && i<arr.length){
        if(arr[i]._id.localeCompare(id)==0){
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
        if(arr[i].benevole._id.localeCompare(id)==0 && heureDebut==arr[i].heureDebut){
            arr.remove(arr[i]);
            removed=true;
        }
        i++;
    }
}

/**
 * Check on every zone if a benevole is available between 2 specified hours
 * @param id the id of the benevole checked
 * @param heureDebut the begin hour checked
 * @param heureFin the end hour checked
 * @returns {Promise<boolean>} true if benevole is available, false if not
 */
async function checkIfAvailableBenev(id, heureDebut, heureFin){
    try {
        let bool = true;
        let i=0;
        const zones = await Zone.find();
        while(bool && i<zones.length){
            let j=0;
            while(bool && j<zones[i].benevoles.length){
                const benevoles = zones[i].benevoles;
                if(benevoles[j].benevole._id.localeCompare(id)==0){
                    if((benevoles[j].heureDebut==heureDebut && benevoles[j].heureFin==heureFin) ||
                        (heureDebut>benevoles[j].heureDebut && heureDebut<benevoles[j].heureFin) ||
                        (heureFin>benevoles[j].heureDebut && heureFin<benevoles[j].heureFin)){
                        bool=false;
                    }
                }
                j++;
            }
            i++;
        }
        return bool;
    }catch (err){
        return false;
    }
}

module.exports = router;
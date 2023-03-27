const express = require('express');
const router = express.Router();
const Festival = require('../../models/Festival');
const FestivalDay = require('../../models/FestivDay')
const Zone = require('../../models/Zone')
const authMiddleware = require('../../middleware/index');
const {addDays} = require("date-fns");
const Benevole = require("../../models/Benevole");

const freeZoneID = "641b1fbd01df06d6d87caa11"

router.use(authMiddleware)

// CREATE: Ajouter un festival
router.post('/', async (req, res) => {
    if(await isAdmin(req.user.uid)) {
        try {
            let days = [];
            let beginningDate = new Date(req.body.dateDebut)
            for (i = 0; i < req.body.nbJours; i++) {
                let date1 = addDays(beginningDate, i).setHours(8, 0, 0);
                let date2 = addDays(beginningDate, i).setHours(20, 0, 0);
                let day = new FestivalDay({
                    name: "Jour " + (i + 1),
                    openingTime: JSON.stringify(date1),
                    closingTime: JSON.stringify(date2)
                })
                days.push(day)
            }
            const festival = new Festival({
                name: req.body.nom,
                beginningDate: req.body.dateDebut,
                days: days,
                zones: [],
            });
            const newFestival = await festival.save();
            let zones= [];
            const freeZone = await Zone.findById(freeZoneID, {jeux:0})
            zones.push(freeZone)
            newFestival.zones=zones;
            res.status(201).json(newFestival);
        } catch (err) {
            res.status(400).json({message: err.message});
        }
    }else{
        res.status(401).json({message : "Unauthorized"})
    }
});

// READ: Obtenir la liste de tous les festivals
router.get('/', async (req, res) => {
    try {
        const festivals = await Festival.find();
        for(festival of festivals){
            festival.zones = await fillZones(festival.zones);
        }
        res.json(festivals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// READ: Obtenir un festival spécifique
router.get('/:id', async(req, res) => {
    try{
        const festival = await Festival.findById(req.params.id)
        festival.zones = await fillZones(festival.zones);
        res.json(festival);
    }catch (err){
        res.status(500).json({message: err.message})
    }

});

// UPDATE: Mettre à jour un nom de festival spécifique
router.patch('/setName/:id', getFestival, async (req, res) => {
    if(await isAdmin(req.user.uid)) {
        if (req.body.nom != null) {
            res.festival.name = req.body.nom;
        }
        try {
            const updatedFestival = await res.festival.save();
            res.json(updatedFestival);
        } catch (err) {
            res.status(400).json({message: err.message});
        }
    }
    else{
        res.status(401).json({message: "Unauthorized"})
    }
});

router.patch('/addZone/:id', getFestival, async(req, res)=>{
    if(await isAdmin(req.user.uid)) {
        if (req.body.zoneId != null) {
            res.festival.zones.push(req.body.zoneId)
        }
        try {
            const updatedFestival = await res.festival.save();
            res.json(updatedFestival);
        } catch (err) {
            res.status(400).json({message: err.message});
        }
    } else{
        res.status(401).json("Unauthorized")
    }
})

router.patch('/setDay/:id', getFestival, async(req, res)=>{
    if(await isAdmin(req.user.uid)){
        try{
            res.festival.days.forEach(day=>{
                if(req.body.dayId.localeCompare(day._id)===0){
                    day.name = req.body.nom;
                    day.openingTime = req.body.heureDebut;
                    day.closingTime = req.body.heureFin;
                }
            })
            const updatedFestival = await res.festival.save();
            res.json(updatedFestival)
        }catch(err){
            res.status(400).json({message: err.message})
        }
    }else{
        res.status(401).json({message: "Unauthorized"})
    }
})

// DELETE: Supprimer un festival spécifique
router.delete('/:id', getFestival, async (req, res) => {
    if(await isAdmin(req.user.uid)) {
        try {
            await deleteZones(req.params.id)
            await deleteDays(req.params.id)
            await res.festival.remove();
            res.json({message: 'Festival supprimé'});
        } catch (err) {
            res.status(500).json({message: err.message});
        }
    }else{
        res.status(401).json({message: "Unauthorized"})
    }
});

// Middleware pour récupérer un festival spécifique
async function getFestival(req, res, next) {
    try {
        const festival = await Festival.findById(req.params.id);
        if (festival == null) {
            return res.status(404).json({ message: 'Festival introuvable' });
        }
        res.festival = festival;
        next();
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

async function deleteZones(idFestival){
    try{
        const festival = await Festival.findById(idFestival);
        await festival.zones.forEach(zone=>{
            Zone.deleteOne({_id: zone._id});
        })
    }catch(err){
        console.log(err.message)
    }
}

async function deleteDays(idFestival){
    try{
        const festival = await Festival.findById(idFestival);
        await festival.days.forEach(day=>{
            FestivalDay.deleteOne({_id: day._id});
        })
    }catch(err){
        console.log(err.message)
    }
}

async function fillZones(arr){
    try{
        let zones= [];
        const freeZone = await Zone.findById(freeZoneID, {jeux:0})
        zones.push(freeZone);
        for(const value of arr){
            const zone = await Zone.findById(value, {jeux: 0});
            const benevoles = await fillBenevole(zone.benevoles)
            zone.benevoles = benevoles
            zones.push(zone)
        }
        return zones;
    }catch (err){
        return[];
    }
}

async function isAdmin(uid){
    try {
        const benevole = await Benevole.find({firebaseID: uid});
        return benevole[0].admin;
    }catch (err){
        console.log(err)
        return false;
    }
}


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

module.exports = router;

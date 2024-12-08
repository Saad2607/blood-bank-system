const mongoose = require("mongoose");
const inventoryModel = require("../models/inventoryModel");
const userModel = require("../models/userModel");

// CREATE INVENTORY
const createInventoryController = async (req, res) => {
    try {
        const {email} = req.body;
        // validation
        const user = await userModel.findOne({email});
        if(!user) {
            throw new Error('User not found');
        }
        // if(inventoryType === "in" && user.role !== 'donar') {
        //     throw new Error('Not a donar account');
        // }
        // if(inventoryType === "out" && user.role !== 'hospital') {
        //     throw new Error('Not a hospital');
        // }

        if(req.body.inventoryType === 'out') {
            const requestedBloodGroup = req.body.bloodGroup;
            const requestedQuantityOfBlood = req.body.quantity;
            const organization = new mongoose.Types.ObjectId(req.body.userId);
            // calculate blood quantity

            const totalInOfRequestedBlood = await inventoryModel.aggregate([
                {$match: {
                    organization,
                    inventoryType: 'in',
                    bloodGroup: requestedBloodGroup
                }},
                {
                    $group: {
                        _id: '$bloodGroup',
                        total: {$sum: '$quantity'}
                    },
                },
            ]);
            // console.log("Total In", totalInOfRequestedBlood);
            const  totalIn = totalInOfRequestedBlood[0]?.total || 0;

            // Calculate OUT blood quantity

            const totalOutOfRequestedBloodGroup = await inventoryModel.aggregate([
                {
                    $match: {
                        organization,
                        inventoryType: 'out',
                        bloodGroup: requestedBloodGroup
                    },
                },
                {
                    $group: {
                        _id: '$bloodGroup',
                        total: {$sum: '$quantity'}
                    },
                },
            ]);
            const  totalOut = totalOutOfRequestedBloodGroup[0]?.total || 0;

            // in & out calculation
            const availableQuantityOfBloodGroup = totalIn - totalOut;
            // quantity validation
            if(availableQuantityOfBloodGroup < requestedQuantityOfBlood) {
                return res.status(500).send({
                    success: false,
                    message: `Only ${availableQuantityOfBloodGroup} ml of ${requestedBloodGroup.toUpperCase()} is available.`,
                })
            }
            req.body.hospital = user?._id;
        } else {
            req.body.donar = user?._id;
        }

        // save record
        const inventory = new inventoryModel(req.body);
        await inventory.save();
        return res.status(201).send({
            success: true,
            message: 'New Blood Record Added'
        })
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'Error In Create Inventory API',
            error
        })
    }
};

// GET ALL BLOOD RECORDS
const getInventoryController = async (req, res) => {
    try {
        const inventory = await inventoryModel.find({organization: req.body.userId}).populate("donar").populate("hospital").sort({ createdAt: -1 });
        return res.status(200).send({
            success: true,
            message: 'Getting All Record Successfully',
            inventory,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'Error In Get All Inventory',
            error
        });
    }
};

// GET HOSPITAL BLOOD RECORDS
const getInventoryHospitalController = async (req, res) => {
    try {
        const inventory = await inventoryModel
            .find(req.body.filters)
            .populate("donar")
            .populate("hospital")
            .populate("organization")
            .sort({ createdAt: -1 });
        return res.status(200).send({
            success: true,
            message: 'Getting Hospital Consumer Record Successfully',
            inventory,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'Error In Get Consumer Inventory',
            error,
        });
    }
};

// GET BLOOD RECORD OF 3
const getRecentInventoryController = async (req, res) => {
    try {
        const inventory = await inventoryModel.find({
            organization: req.body.userId,
        }).limit(3).sort({createdAt: -1});
        return res.status(200).send({
            success: true,
            message: 'Recent Inventory Data',
            inventory,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'Error in Get Recent Inventory',
            error,
        });
    }
};

// GET DONAR RECORDS
const getDonarsController = async (req, res) => {
    try {
        const organization = req.body.userId;
        // find donars
        const donarId = await inventoryModel.distinct("donar", {
            organization,
        });
        // console.log(donarId);
        const donars = await userModel.find({_id: {$in: donarId}});
        return res.status(200).send({
            success: true,
            message: 'Donar Record Fetched Successfully',
            donars,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'Error in Donars Record',
            error,
        });
    }
};

// GET HOSPITAL RECORDS
const getHospitalsController = async (req, res) => {
    try {
        const organization = req.body.userId;
        // find hospitals
        const hospitalId = await inventoryModel.distinct("hospital", {
            organization,
        });
        // console.log(donarId);
        const hospitals = await userModel.find({_id: {$in: hospitalId}});
        return res.status(200).send({
            success: true,
            message: 'Hospitals Record Fetched Successfully',
            hospitals,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'Error in Hospital Record',
            error,
        });
    }
};

// GET ORGANIZATION RECORDS
const getOrganizationsController = async (req, res) => {
    try {
        const donar = req.body.userId;
        const orgId = await inventoryModel.distinct("organization", {donar});
        // find organization
        const organizations = await userModel.find({_id: {$in: orgId}});
        return res.status(200).send({
            success: true,
            message: 'Organization Record Fetched Successfully',
            organizations,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'Error in Organization Record',
            error,
        });
    }
};

// GET ORGANIZATION RECORDS FOR HOSPITAL
const getOrganizationsForHospitalController = async (req, res) => {
    try {
        const hospital = req.body.userId;
        const orgId = await inventoryModel.distinct("organization", {hospital});
        // find organization
        const organizations = await userModel.find({_id: {$in: orgId}});
        return res.status(200).send({
            success: true,
            message: 'Hospital Organization Record Fetched Successfully',
            organizations,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'Error in Hospital Organization Record',
            error,
        });
    }
};

module.exports = { 
    createInventoryController, 
    getInventoryController,
    getInventoryHospitalController,
    getRecentInventoryController,
    getDonarsController, 
    getHospitalsController, 
    getOrganizationsController,
    getOrganizationsForHospitalController
};
const express = require('express');
const Vehicle = require('../models/Vehicle');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/vehicles
router.get('/', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        res.json({
            success: true,
            data: vehicles
        });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching vehicles'
        });
    }
});

// GET /api/vehicles/:id
router.get('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching vehicle'
        });
    }
});

// POST /api/vehicles
router.post('/', async (req, res) => {
    try {
        const { name, number, purchaseDate } = req.body;

        if (!name || !number || !purchaseDate) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const vehicle = new Vehicle({
            userId: req.user._id,
            name: name.trim(),
            number: number.trim(),
            purchaseDate: new Date(purchaseDate)
        });

        await vehicle.save();

        res.status(201).json({
            success: true,
            message: 'Vehicle added successfully',
            data: vehicle
        });
    } catch (error) {
        console.error('Error adding vehicle:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding vehicle'
        });
    }
});

// PUT /api/vehicles/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, number, purchaseDate } = req.body;
        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            {
                name: name.trim(),
                number: number.trim(),
                purchaseDate: new Date(purchaseDate)
            },
            { new: true }
        );

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.json({
            success: true,
            message: 'Vehicle updated successfully',
            data: vehicle
        });
    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating vehicle'
        });
    }
});

// DELETE /api/vehicles/:id
router.delete('/:id', async (req, res) => {
    try {
        const vehicle = await Vehicle.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.json({
            success: true,
            message: 'Vehicle deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting vehicle'
        });
    }
});

// POST /api/vehicles/:id/logs
router.post('/:id/logs', async (req, res) => {
    try {
        const { date, fuelAmount, fuelCapacity, km, tripA, tripB, average, range } = req.body;

        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        vehicle.logs.push({
            date: new Date(date),
            fuelAmount: Number(fuelAmount),
            fuelCapacity: Number(fuelCapacity),
            km: Number(km),
            tripA: Number(tripA),
            tripB: Number(tripB),
            average: Number(average),
            range: Number(range)
        });

        await vehicle.save();

        res.status(201).json({
            success: true,
            message: 'Log added successfully',
            data: vehicle
        });
    } catch (error) {
        console.error('Error adding log:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding log'
        });
    }
});

// DELETE /api/vehicles/:id/logs/:logId
router.delete('/:id/logs/:logId', async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        vehicle.logs.id(req.params.logId).deleteOne();
        await vehicle.save();

        res.json({
            success: true,
            message: 'Log deleted successfully',
            data: vehicle
        });
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting log'
        });
    }
});

// PUT /api/vehicles/:id/logs/:logId
router.put('/:id/logs/:logId', async (req, res) => {
    try {
        const { date, fuelAmount, fuelCapacity, km, tripA, tripB, average, range } = req.body;

        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        const log = vehicle.logs.id(req.params.logId);
        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log not found'
            });
        }

        log.date = new Date(date);
        log.fuelAmount = Number(fuelAmount);
        log.fuelCapacity = Number(fuelCapacity);
        log.km = Number(km);
        log.tripA = Number(tripA);
        log.tripB = Number(tripB);
        log.average = Number(average);
        log.range = Number(range);

        await vehicle.save();

        res.json({
            success: true,
            message: 'Log updated successfully',
            data: vehicle
        });
    } catch (error) {
        console.error('Error updating log:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating log'
        });
    }
});

module.exports = router;

const express = require('express');
const AmountType = require('../models/AmountType');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// GET all amount types
router.get('/', async (req, res) => {
    try {
        const amountTypes = await AmountType.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: amountTypes
        });
    } catch (error) {
        console.error('Error fetching amount types:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching amount types'
        });
    }
});

// GET single amount type by ID
router.get('/:id', async (req, res) => {
    try {
        const amountType = await AmountType.findById(req.params.id);

        if (!amountType) {
            return res.status(404).json({
                success: false,
                message: 'Amount type not found'
            });
        }

        res.json({
            success: true,
            data: amountType
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount type ID'
            });
        }
        console.error('Error fetching amount type:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching amount type'
        });
    }
});

// POST create new amount type
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Amount type name is required'
            });
        }

        if (name.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Amount type name must be at least 2 characters long'
            });
        }

        // Check if amount type already exists
        const existingAmountType = await AmountType.findOne({
            name: name.trim()
        });

        if (existingAmountType) {
            return res.status(400).json({
                success: false,
                message: 'Amount type with this name already exists'
            });
        }

        // Create new amount type
        const amountType = new AmountType({
            name: name.trim()
        });

        await amountType.save();

        res.status(201).json({
            success: true,
            message: 'Amount type created successfully',
            data: amountType
        });
    } catch (error) {
        console.error('Error creating amount type:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Amount type with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating amount type'
        });
    }
});

// PUT update amount type
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Amount type name is required'
            });
        }

        if (name.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Amount type name must be at least 2 characters long'
            });
        }

        // Check if amount type exists
        const amountType = await AmountType.findById(req.params.id);

        if (!amountType) {
            return res.status(404).json({
                success: false,
                message: 'Amount type not found'
            });
        }

        // Check if another amount type with same name exists
        const existingAmountType = await AmountType.findOne({
            name: name.trim(),
            _id: { $ne: req.params.id }
        });

        if (existingAmountType) {
            return res.status(400).json({
                success: false,
                message: 'Amount type with this name already exists'
            });
        }

        // Update amount type
        amountType.name = name.trim();
        await amountType.save();

        res.json({
            success: true,
            message: 'Amount type updated successfully',
            data: amountType
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount type ID'
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Amount type with this name already exists'
            });
        }

        console.error('Error updating amount type:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating amount type'
        });
    }
});

// DELETE amount type
router.delete('/:id', async (req, res) => {
    try {
        const amountType = await AmountType.findById(req.params.id);

        if (!amountType) {
            return res.status(404).json({
                success: false,
                message: 'Amount type not found'
            });
        }

        await AmountType.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Amount type deleted successfully'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount type ID'
            });
        }
        console.error('Error deleting amount type:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting amount type'
        });
    }
});

// PATCH update amount type status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        // Validation
        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either "active" or "inactive"'
            });
        }

        const amountType = await AmountType.findById(req.params.id);

        if (!amountType) {
            return res.status(404).json({
                success: false,
                message: 'Amount type not found'
            });
        }

        amountType.status = status;
        await amountType.save();

        res.json({
            success: true,
            message: `Amount type status updated to ${status}`,
            data: amountType
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount type ID'
            });
        }
        console.error('Error updating amount type status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating amount type status'
        });
    }
});

module.exports = router;


const express = require('express');
const PaymentMethod = require('../models/PaymentMethod');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// GET all payment methods
router.get('/', async (req, res) => {
    try {
        const paymentMethods = await PaymentMethod.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: paymentMethods
        });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching payment methods'
        });
    }
});

// GET single payment method by ID
router.get('/:id', async (req, res) => {
    try {
        const paymentMethod = await PaymentMethod.findById(req.params.id);

        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }

        res.json({
            success: true,
            data: paymentMethod
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method ID'
            });
        }
        console.error('Error fetching payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching payment method'
        });
    }
});

// POST create new payment method
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Payment method name is required'
            });
        }

        if (name.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Payment method name must be at least 2 characters long'
            });
        }

        // Check if payment method already exists
        const existingPaymentMethod = await PaymentMethod.findOne({
            name: name.trim()
        });

        if (existingPaymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Payment method with this name already exists'
            });
        }

        // Create new payment method
        const paymentMethod = new PaymentMethod({
            name: name.trim()
        });

        await paymentMethod.save();

        res.status(201).json({
            success: true,
            message: 'Payment method created successfully',
            data: paymentMethod
        });
    } catch (error) {
        console.error('Error creating payment method:', error);

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
                message: 'Payment method with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating payment method'
        });
    }
});

// PUT update payment method
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Payment method name is required'
            });
        }

        if (name.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Payment method name must be at least 2 characters long'
            });
        }

        // Check if payment method exists
        const paymentMethod = await PaymentMethod.findById(req.params.id);

        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }

        // Check if another payment method with same name exists
        const existingPaymentMethod = await PaymentMethod.findOne({
            name: name.trim(),
            _id: { $ne: req.params.id }
        });

        if (existingPaymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Payment method with this name already exists'
            });
        }

        // Update payment method
        paymentMethod.name = name.trim();
        await paymentMethod.save();

        res.json({
            success: true,
            message: 'Payment method updated successfully',
            data: paymentMethod
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method ID'
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
                message: 'Payment method with this name already exists'
            });
        }

        console.error('Error updating payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating payment method'
        });
    }
});

// DELETE payment method
router.delete('/:id', async (req, res) => {
    try {
        const paymentMethod = await PaymentMethod.findById(req.params.id);

        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }

        await PaymentMethod.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Payment method deleted successfully'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method ID'
            });
        }
        console.error('Error deleting payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting payment method'
        });
    }
});

// PATCH update payment method status
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

        const paymentMethod = await PaymentMethod.findById(req.params.id);

        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }

        paymentMethod.status = status;
        await paymentMethod.save();

        res.json({
            success: true,
            message: `Payment method status updated to ${status}`,
            data: paymentMethod
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method ID'
            });
        }
        console.error('Error updating payment method status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating payment method status'
        });
    }
});

module.exports = router;


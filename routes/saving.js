const express = require('express');
const Saving = require('../models/Saving');
const Category = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');
const AmountType = require('../models/AmountType');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET all savings with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, category, paymentMethod, amountType } = req.query;
        const query = { userId: req.user._id };

        // Date range filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        // Category filter
        if (category && category !== 'all') {
            query.category = category;
        }

        // Payment method filter
        if (paymentMethod && paymentMethod !== 'all') {
            query.paymentMethod = paymentMethod;
        }

        // Amount type filter
        if (amountType && amountType !== 'all') {
            query.amountType = amountType;
        }

        const savings = await Saving.find(query)
            .populate('category', 'name')
            .populate('paymentMethod', 'name')
            .populate('amountType', 'name')
            .sort({ date: -1, createdAt: -1 });

        res.json({
            success: true,
            data: savings
        });
    } catch (error) {
        console.error('Error fetching savings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching savings'
        });
    }
});

// GET total savings
router.get('/total', async (req, res) => {
    try {
        const savings = await Saving.find({ userId: req.user._id })
            .populate('amountType', 'name');

        let totalSavings = 0;
        savings.forEach(saving => {
            const amountTypeName = saving.amountType.name.toLowerCase();
            const isCredit = amountTypeName.includes('credit') ||
                amountTypeName.includes('income');
            if (isCredit) {
                totalSavings += saving.amount;
            } else {
                totalSavings -= saving.amount;
            }
        });

        res.json({
            success: true,
            total: totalSavings
        });
    } catch (error) {
        console.error('Error fetching total savings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching total savings'
        });
    }
});

// GET single saving
router.get('/:id', async (req, res) => {
    try {
        const saving = await Saving.findOne({
            _id: req.params.id,
            userId: req.user._id
        })
            .populate('category', 'name')
            .populate('paymentMethod', 'name')
            .populate('amountType', 'name');

        if (!saving) {
            return res.status(404).json({
                success: false,
                message: 'Saving not found'
            });
        }

        res.json({
            success: true,
            data: saving
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid saving ID'
            });
        }
        console.error('Error fetching saving:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching saving'
        });
    }
});

// POST create saving
router.post('/', async (req, res) => {
    try {
        const { amount, category, paymentMethod, amountType, date, description } = req.body;

        // Validation
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Payment method is required'
            });
        }

        if (!amountType) {
            return res.status(400).json({
                success: false,
                message: 'Amount type is required'
            });
        }

        // Verify category, payment method, and amount type exist and are active
        const [cat, pm, at] = await Promise.all([
            Category.findById(category),
            PaymentMethod.findById(paymentMethod),
            AmountType.findById(amountType)
        ]);

        if (!cat || cat.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive category'
            });
        }

        if (!pm || pm.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive payment method'
            });
        }

        if (!at || at.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive amount type'
            });
        }

        // Create saving
        const saving = new Saving({
            userId: req.user._id,
            amount,
            category,
            paymentMethod,
            amountType,
            date: date ? new Date(date) : new Date(),
            description: description || ''
        });

        await saving.save();

        // Populate before sending response
        await saving.populate('category', 'name');
        await saving.populate('paymentMethod', 'name');
        await saving.populate('amountType', 'name');

        res.status(201).json({
            success: true,
            message: 'Saving created successfully',
            data: saving
        });
    } catch (error) {
        console.error('Error creating saving:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating saving'
        });
    }
});

// PUT update saving
router.put('/:id', async (req, res) => {
    try {
        const { amount, category, paymentMethod, amountType, date, description } = req.body;

        const saving = await Saving.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!saving) {
            return res.status(404).json({
                success: false,
                message: 'Saving not found'
            });
        }

        // Validation
        if (amount !== undefined && amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be positive'
            });
        }

        // Verify references if provided
        if (category) {
            const cat = await Category.findById(category);
            if (!cat || cat.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or inactive category'
                });
            }
        }

        if (paymentMethod) {
            const pm = await PaymentMethod.findById(paymentMethod);
            if (!pm || pm.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or inactive payment method'
                });
            }
        }

        if (amountType) {
            const at = await AmountType.findById(amountType);
            if (!at || at.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or inactive amount type'
                });
            }
        }

        // Update fields
        if (amount !== undefined) saving.amount = amount;
        if (category) saving.category = category;
        if (paymentMethod) saving.paymentMethod = paymentMethod;
        if (amountType) saving.amountType = amountType;
        if (date) saving.date = new Date(date);
        if (description !== undefined) saving.description = description || '';

        await saving.save();

        // Populate before sending response
        await saving.populate('category', 'name');
        await saving.populate('paymentMethod', 'name');
        await saving.populate('amountType', 'name');

        res.json({
            success: true,
            message: 'Saving updated successfully',
            data: saving
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid saving ID'
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        console.error('Error updating saving:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating saving'
        });
    }
});

// DELETE saving
router.delete('/:id', async (req, res) => {
    try {
        const saving = await Saving.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!saving) {
            return res.status(404).json({
                success: false,
                message: 'Saving not found'
            });
        }

        await Saving.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Saving deleted successfully'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid saving ID'
            });
        }
        console.error('Error deleting saving:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting saving'
        });
    }
});

module.exports = router;


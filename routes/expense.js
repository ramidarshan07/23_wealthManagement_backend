const express = require('express');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');
const AmountType = require('../models/AmountType');
const Balance = require('../models/Balance');
const { authenticate } = require('../middleware/auth');
const { updatePaymentMethodBalance } = require('../routes/paymentMethodBalance');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET all expenses with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, category, paymentMethod } = req.query;
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

        const expenses = await Expense.find(query)
            .populate('category', 'name')
            .populate('paymentMethod', 'name')
            .populate('amountType', 'name')
            .sort({ date: -1, createdAt: -1 });

        res.json({
            success: true,
            data: expenses
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching expenses'
        });
    }
});

// GET expense statistics
router.get('/stats', async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user._id })
            .populate('amountType', 'name')
            .populate('paymentMethod', 'name');

        let totalCredit = 0;
        let totalDebit = 0;
        const paymentMethodStats = {};

        expenses.forEach(expense => {
            const amountTypeName = expense.amountType.name.toLowerCase();
            const isCredit = amountTypeName.includes('credit') ||
                amountTypeName.includes('income');
            const amount = expense.amount;

            if (isCredit) {
                totalCredit += amount;
            } else {
                totalDebit += amount;
            }

            // Payment method wise stats
            const pmId = expense.paymentMethod._id.toString();
            if (!paymentMethodStats[pmId]) {
                paymentMethodStats[pmId] = {
                    paymentMethodId: pmId,
                    name: expense.paymentMethod.name,
                    credit: 0,
                    debit: 0
                };
            }

            if (isCredit) {
                paymentMethodStats[pmId].credit += amount;
            } else {
                paymentMethodStats[pmId].debit += amount;
            }
        });

        res.json({
            success: true,
            data: {
                totalCredit,
                totalDebit,
                paymentMethodStats: Object.values(paymentMethodStats)
            }
        });
    } catch (error) {
        console.error('Error fetching expense stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching expense statistics'
        });
    }
});

// GET single expense
router.get('/:id', async (req, res) => {
    try {
        const expense = await Expense.findOne({
            _id: req.params.id,
            userId: req.user._id
        })
            .populate('category', 'name')
            .populate('paymentMethod', 'name')
            .populate('amountType', 'name');

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.json({
            success: true,
            data: expense
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense ID'
            });
        }
        console.error('Error fetching expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching expense'
        });
    }
});

// POST create expense
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

        // Create expense
        const expense = new Expense({
            userId: req.user._id,
            amount,
            category,
            paymentMethod,
            amountType,
            date: date ? new Date(date) : new Date(),
            description: description || ''
        });

        await expense.save();

        // Update payment method balance
        await updatePaymentMethodBalance(req.user._id, paymentMethod, amount, amountType, false);

        // Populate before sending response
        await expense.populate('category', 'name');
        await expense.populate('paymentMethod', 'name');
        await expense.populate('amountType', 'name');

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: expense
        });
    } catch (error) {
        console.error('Error creating expense:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating expense'
        });
    }
});

// PUT update expense
router.put('/:id', async (req, res) => {
    try {
        const { amount, category, paymentMethod, amountType, date, description } = req.body;

        const expense = await Expense.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        // Store old values for balance update
        const oldAmount = expense.amount;
        const oldAmountType = expense.amountType;
        const oldPaymentMethod = expense.paymentMethod;

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
        if (amount !== undefined) expense.amount = amount;
        if (category) expense.category = category;
        if (paymentMethod) expense.paymentMethod = paymentMethod;
        if (amountType) expense.amountType = amountType;
        if (date) expense.date = new Date(date);
        if (description !== undefined) expense.description = description || '';

        await expense.save();

        // Update payment method balance - reverse old transaction and add new one
        await updatePaymentMethodBalance(req.user._id, oldPaymentMethod, oldAmount, oldAmountType, true);
        await updatePaymentMethodBalance(req.user._id, expense.paymentMethod, expense.amount, expense.amountType, false);

        // Populate before sending response
        await expense.populate('category', 'name');
        await expense.populate('paymentMethod', 'name');
        await expense.populate('amountType', 'name');

        res.json({
            success: true,
            message: 'Expense updated successfully',
            data: expense
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense ID'
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        console.error('Error updating expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating expense'
        });
    }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
    try {
        const expense = await Expense.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        // Update payment method balance - reverse the transaction
        await updatePaymentMethodBalance(req.user._id, expense.paymentMethod, expense.amount, expense.amountType, true);

        await Expense.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense ID'
            });
        }
        console.error('Error deleting expense:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting expense'
        });
    }
});

module.exports = router;


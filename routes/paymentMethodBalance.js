const express = require('express');
const PaymentMethodBalance = require('../models/PaymentMethodBalance');
const Balance = require('../models/Balance');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Helper function to update main balance from all payment method balances
const updateMainBalance = async (userId) => {
    try {
        const paymentMethodBalances = await PaymentMethodBalance.find({ userId });
        const totalBalance = paymentMethodBalances.reduce((sum, pmb) => sum + (pmb.balance || 0), 0);

        let mainBalance = await Balance.findOne({ userId });
        if (!mainBalance) {
            mainBalance = new Balance({ userId, currentBalance: totalBalance });
        } else {
            mainBalance.currentBalance = totalBalance;
        }
        await mainBalance.save();
        return totalBalance;
    } catch (error) {
        console.error('Error updating main balance:', error);
    }
};

// GET all payment method balances for user
router.get('/', async (req, res) => {
    try {
        const balances = await PaymentMethodBalance.find({ userId: req.user._id })
            .populate('paymentMethodId', 'name status');

        res.json({
            success: true,
            data: balances
        });
    } catch (error) {
        console.error('Error fetching payment method balances:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching payment method balances'
        });
    }
});

// GET single payment method balance
router.get('/:paymentMethodId', async (req, res) => {
    try {
        const balance = await PaymentMethodBalance.findOne({
            userId: req.user._id,
            paymentMethodId: req.params.paymentMethodId
        }).populate('paymentMethodId', 'name status');

        if (!balance) {
            return res.json({
                success: true,
                data: {
                    userId: req.user._id,
                    paymentMethodId: req.params.paymentMethodId,
                    balance: 0
                }
            });
        }

        res.json({
            success: true,
            data: balance
        });
    } catch (error) {
        console.error('Error fetching payment method balance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching payment method balance'
        });
    }
});

// PUT update payment method balance
router.put('/:paymentMethodId', async (req, res) => {
    try {
        const { balance } = req.body;

        if (balance === undefined || balance === null) {
            return res.status(400).json({
                success: false,
                message: 'Balance is required'
            });
        }

        if (typeof balance !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Balance must be a number'
            });
        }

        let paymentMethodBalance = await PaymentMethodBalance.findOne({
            userId: req.user._id,
            paymentMethodId: req.params.paymentMethodId
        });

        if (!paymentMethodBalance) {
            paymentMethodBalance = new PaymentMethodBalance({
                userId: req.user._id,
                paymentMethodId: req.params.paymentMethodId,
                balance: balance
            });
        } else {
            paymentMethodBalance.balance = balance;
        }

        await paymentMethodBalance.save();

        // Update main balance
        await updateMainBalance(req.user._id);

        await paymentMethodBalance.populate('paymentMethodId', 'name status');

        res.json({
            success: true,
            message: 'Payment method balance updated successfully',
            data: paymentMethodBalance
        });
    } catch (error) {
        console.error('Error updating payment method balance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating payment method balance'
        });
    }
});

module.exports = router;
module.exports.updateMainBalance = updateMainBalance;
module.exports.updatePaymentMethodBalance = async (userId, paymentMethodId, amount, amountTypeId, isDelete = false) => {
    try {
        // Get amount type to determine if it's credit or debit
        const AmountType = require('../models/AmountType');
        const amountType = await AmountType.findById(amountTypeId);
        if (!amountType) return;

        const isCredit = amountType.name.toLowerCase().includes('credit') ||
            amountType.name.toLowerCase().includes('income');

        let paymentMethodBalance = await PaymentMethodBalance.findOne({
            userId,
            paymentMethodId
        });

        if (!paymentMethodBalance) {
            paymentMethodBalance = new PaymentMethodBalance({
                userId,
                paymentMethodId,
                balance: 0
            });
        }

        if (isDelete) {
            // Reverse the transaction
            paymentMethodBalance.balance += isCredit ? -amount : amount;
        } else {
            // Add the transaction
            paymentMethodBalance.balance += isCredit ? amount : -amount;
        }

        await paymentMethodBalance.save();

        // Update main balance
        await updateMainBalance(userId);
    } catch (error) {
        console.error('Error updating payment method balance:', error);
    }
};


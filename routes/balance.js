const express = require('express');
const Balance = require('../models/Balance');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET current balance
router.get('/', async (req, res) => {
    try {
        let balance = await Balance.findOne({ userId: req.user._id });
        
        if (!balance) {
            // Create balance if doesn't exist
            balance = new Balance({
                userId: req.user._id,
                currentBalance: 0
            });
            await balance.save();
        }

        res.json({
            success: true,
            data: balance
        });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching balance'
        });
    }
});

// PUT update current balance
router.put('/', async (req, res) => {
    try {
        const { currentBalance } = req.body;

        if (currentBalance === undefined || currentBalance === null) {
            return res.status(400).json({
                success: false,
                message: 'Current balance is required'
            });
        }

        if (typeof currentBalance !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Current balance must be a number'
            });
        }

        let balance = await Balance.findOne({ userId: req.user._id });
        
        if (!balance) {
            balance = new Balance({
                userId: req.user._id,
                currentBalance: currentBalance
            });
        } else {
            balance.currentBalance = currentBalance;
        }

        await balance.save();

        res.json({
            success: true,
            message: 'Balance updated successfully',
            data: balance
        });
    } catch (error) {
        console.error('Error updating balance:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating balance'
        });
    }
});

module.exports = router;

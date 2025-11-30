const express = require('express');
const Account = require('../models/Account');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

const buildAccountSummary = (account) => {
    const isLentAccount = account.accountType === 'lent';
    
    const totals = account.transactions.reduce((acc, txn) => {
        if (isLentAccount) {
            // For lent accounts: lent = money given, received = money received back
            if (txn.type === 'lent') {
                acc.totalBorrowed += txn.amount; // Total lent
            } else if (txn.type === 'received') {
                acc.totalRepaid += txn.amount; // Total received back
                if (!acc.lastRepaymentDate || txn.date > acc.lastRepaymentDate) {
                    acc.lastRepaymentDate = txn.date;
                }
            }
        } else {
            // For borrowed accounts: borrow = money taken, repay = money paid back
            if (txn.type === 'borrow') {
                acc.totalBorrowed += txn.amount;
            } else if (txn.type === 'repay') {
                acc.totalRepaid += txn.amount;
                if (!acc.lastRepaymentDate || txn.date > acc.lastRepaymentDate) {
                    acc.lastRepaymentDate = txn.date;
                }
            }
        }
        return acc;
    }, {
        totalBorrowed: 0,
        totalRepaid: 0,
        lastRepaymentDate: null
    });

    return {
        totalBorrowed: totals.totalBorrowed,
        totalRepaid: totals.totalRepaid,
        outstanding: totals.totalBorrowed - totals.totalRepaid,
        lastRepaymentDate: totals.lastRepaymentDate
    };
};

// GET /api/accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await Account.find({
            userId: req.user._id,
            status: 'active'
        }).sort({ updatedAt: -1 });

        const payload = accounts.map(account => {
            return {
                ...account.toObject(),
                summary: buildAccountSummary(account)
            };
        });

        res.json({
            success: true,
            data: payload
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching accounts'
        });
    }
});

// GET /api/accounts/:id
router.get('/:id', async (req, res) => {
    try {
        const account = await Account.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        res.json({
            success: true,
            data: {
                ...account.toObject(),
                summary: buildAccountSummary(account)
            }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid account ID'
            });
        }
        console.error('Error fetching account:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching account'
        });
    }
});

// POST /api/accounts
router.post('/', async (req, res) => {
    try {
        const { name, initialAmount, date, paymentChannel, note, description, accountType } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Account name is required'
            });
        }

        if (!initialAmount || Number(initialAmount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Initial amount must be greater than zero'
            });
        }

        const transactionDate = date ? new Date(date) : new Date();
        const accType = accountType === 'lent' ? 'lent' : 'borrowed';
        const initialTransactionType = accType === 'lent' ? 'lent' : 'borrow';

        const account = new Account({
            userId: req.user._id,
            name: name.trim(),
            description: description?.trim() || '',
            accountType: accType,
            transactions: [
                {
                    amount: Number(initialAmount),
                    type: initialTransactionType,
                    paymentChannel: paymentChannel?.trim() || 'Cash',
                    note: note?.trim() || 'Opening balance',
                    date: transactionDate
                }
            ]
        });

        await account.save();

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                ...account.toObject(),
                summary: buildAccountSummary(account)
            }
        });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating account'
        });
    }
});

// POST /api/accounts/:id/transactions
router.post('/:id/transactions', async (req, res) => {
    try {
        const { amount, type, paymentChannel, note, date } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than zero'
            });
        }

        if (!['borrow', 'repay', 'lent', 'received'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction type'
            });
        }

        // Validate transaction type based on account type
        const account = await Account.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        if (account.accountType === 'lent') {
            if (!['lent', 'received'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'For lent accounts, use "lent" or "received" transaction types'
                });
            }
        } else {
            if (!['borrow', 'repay'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'For borrowed accounts, use "borrow" or "repay" transaction types'
                });
            }
        }

        const transactionDate = date ? new Date(date) : new Date();

        account.transactions.push({
            amount: Number(amount),
            type,
            paymentChannel: paymentChannel?.trim() || 'Cash',
            note: note?.trim() || '',
            date: transactionDate
        });

        await account.save();

        res.status(201).json({
            success: true,
            message: 'Transaction added successfully',
            data: {
                ...account.toObject(),
                summary: buildAccountSummary(account)
            }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid account ID'
            });
        }
        console.error('Error adding transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding transaction'
        });
    }
});

// DELETE /api/accounts/:id/transactions/:transactionId
router.delete('/:id/transactions/:transactionId', async (req, res) => {
    try {
        const account = await Account.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        const transaction = account.transactions.id(req.params.transactionId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        account.transactions.id(req.params.transactionId).deleteOne();

        await account.save();

        res.json({
            success: true,
            message: 'Transaction removed successfully',
            data: {
                ...account.toObject(),
                summary: buildAccountSummary(account)
            }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid account or transaction ID'
            });
        }
        console.error('Error deleting transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting transaction'
        });
    }
});

module.exports = router;



require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/category');
const paymentMethodRoutes = require('./routes/paymentMethod');
const amountTypeRoutes = require('./routes/amountType');
const expenseRoutes = require('./routes/expense');
const balanceRoutes = require('./routes/balance');
const paymentMethodBalanceRoutes = require('./routes/paymentMethodBalance');
const savingRoutes = require('./routes/saving');
const accountRoutes = require('./routes/account');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/amount-types', amountTypeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/payment-method-balances', paymentMethodBalanceRoutes);
app.use('/api/savings', savingRoutes);
app.use('/api/accounts', accountRoutes);

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>WealthManagement</title>
            <style>
                body {
                    margin: 0;
                    height: 95vh;
                    background: linear-gradient(to top, rgb(255,107,53), rgb(57,35,28));
                    color: white;
                    font-family: Arial, sans-serif;
                    font-size: 32px;
                    text-align:center;
                }
            </style>
        </head>
        <body>

            <h2 style="
                background: linear-gradient(to right, white, orange);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: bold;
            ">
                Welcome to Wealth Management
            </h2>
            <span>Backend is Running</span><br><br>
            <span style="font-size:20px;">Made with ❤️ by Darshan Rami</span>
        </body>
        </html>
    `);
});




const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('MongoDB connected');
        const PORT = process.env.PORT;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

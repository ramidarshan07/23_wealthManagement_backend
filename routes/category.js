const express = require('express');
const Category = require('../models/Category');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// GET all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching categories'
        });
    }
});

// GET single category by ID
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching category'
        });
    }
});

// POST create new category
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        if (name.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Category name must be at least 2 characters long'
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({
            name: name.trim()
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        // Create new category
        const category = new Category({
            name: name.trim()
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);

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
                message: 'Category with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating category'
        });
    }
});

// PUT update category
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        if (name.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Category name must be at least 2 characters long'
            });
        }

        // Check if category exists
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if another category with same name exists
        const existingCategory = await Category.findOne({
            name: name.trim(),
            _id: { $ne: req.params.id }
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        // Update category
        category.name = name.trim();
        await category.save();

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
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
                message: 'Category with this name already exists'
            });
        }

        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating category'
        });
    }
});

// DELETE category
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        await Category.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting category'
        });
    }
});

// PATCH update category status
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

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        category.status = status;
        await category.save();

        res.json({
            success: true,
            message: `Category status updated to ${status}`,
            data: category
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }
        console.error('Error updating category status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating category status'
        });
    }
});

module.exports = router;


const express = require('express');
const Note = require('../models/Note');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET all notes
router.get('/', async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: notes
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching notes'
        });
    }
});

// POST create note
router.post('/', async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        const note = new Note({
            userId: req.user._id,
            title,
            content
        });

        await note.save();

        res.status(201).json({
            success: true,
            message: 'Note created successfully',
            data: note
        });
    } catch (error) {
        console.error('Error creating note:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error while creating note'
        });
    }
});

// PUT update note
router.put('/:id', async (req, res) => {
    try {
        const { title, content } = req.body;

        const note = await Note.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        if (title) note.title = title;
        if (content) note.content = content;

        await note.save();

        res.json({
            success: true,
            message: 'Note updated successfully',
            data: note
        });
    } catch (error) {
        console.error('Error updating note:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid note ID'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error while updating note'
        });
    }
});

// DELETE note
router.delete('/:id', async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid note ID'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error while deleting note'
        });
    }
});

module.exports = router;

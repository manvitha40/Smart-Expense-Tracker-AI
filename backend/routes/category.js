const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Category } = require('../config/db');

// @route   POST api/categories
// @desc    Create a category
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, color, icon } = req.body;
  try {
    const category = await Category.create({
      userId: req.user.id,
      name,
      color: color || '#4F46E5',
      icon: icon || 'Tag'
    });
    res.json(category);
  } catch (err) {
    console.error('Create category error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/categories
// @desc    Get all categories for user (and system ones)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id });
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/categories/:id
// @desc    Update a category
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { name, color, icon } = req.body;
  try {
    let category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ msg: 'Category not found' });
    if (String(category.userId) !== String(req.user.id)) return res.status(401).json({ msg: 'Not authorized' });

    const updates = {
      name: name || category.name,
      color: color || category.color,
      icon: icon || category.icon
    };

    category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(category);
  } catch (err) {
    console.error('Update category error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/categories/:id
// @desc    Delete a category
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ msg: 'Category not found' });
    if (String(category.userId) !== String(req.user.id)) return res.status(401).json({ msg: 'Not authorized' });

    await Category.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Category removed' });
  } catch (err) {
    console.error('Delete category error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

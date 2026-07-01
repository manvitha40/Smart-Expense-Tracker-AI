const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Income } = require('../config/db');

// @route   POST api/income
// @desc    Add new income
// @access  Private
router.post('/', auth, async (req, res) => {
  const { amount, source, description, date } = req.body;

  try {
    const newIncome = await Income.create({
      userId: req.user.id,
      amount: Number(amount),
      source,
      description: description || '',
      date: date ? new Date(date) : new Date()
    });

    res.json(newIncome);
  } catch (err) {
    console.error('Add income error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/income
// @desc    Get all income logs
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const incomes = await Income.find({ userId: req.user.id });
    // Sort by date descending
    incomes.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(incomes);
  } catch (err) {
    console.error('Get incomes error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/income/:id
// @desc    Update an income log
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { amount, source, description, date } = req.body;

  try {
    let income = await Income.findById(req.params.id);
    if (!income) return res.status(404).json({ msg: 'Income record not found' });
    
    // Check ownership
    if (income.userId !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const updates = {
      amount: amount !== undefined ? Number(amount) : income.amount,
      source: source || income.source,
      description: description !== undefined ? description : income.description,
      date: date ? new Date(date) : income.date
    };

    income = await Income.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(income);
  } catch (err) {
    console.error('Update income error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/income/:id
// @desc    Delete an income log
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let income = await Income.findById(req.params.id);
    if (!income) return res.status(404).json({ msg: 'Income record not found' });

    // Check ownership
    if (income.userId !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Income.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Income removed' });
  } catch (err) {
    console.error('Delete income error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

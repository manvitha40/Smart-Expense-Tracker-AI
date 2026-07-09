const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Goal } = require('../config/db');

// GET all goals for user
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });
    res.json(goals);
  } catch (err) {
    console.error('Get goals error:', err.message);
    res.status(500).send('Server error');
  }
});

// POST create a new goal
router.post('/', auth, async (req, res) => {
  const { title, targetAmount, deadline, icon, color } = req.body;
  if (!title || !targetAmount) return res.status(400).json({ msg: 'Title and target amount required' });

  try {
    const newGoal = await Goal.create({
      userId: req.user.id,
      title,
      targetAmount: Number(targetAmount),
      savedAmount: 0,
      deadline: deadline ? new Date(deadline) : null,
      icon: icon || '🎯',
      color: color || '#0D9488'
    });
    res.json(newGoal);
  } catch (err) {
    console.error('Create goal error:', err.message);
    res.status(500).send('Server error');
  }
});

// PUT add savings to a goal
router.put('/:id/contribute', auth, async (req, res) => {
  const { amount } = req.body;
  const contribution = Number(amount);
  if (isNaN(contribution) || contribution <= 0) {
    return res.status(400).json({ msg: 'Invalid contribution amount' });
  }

  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ msg: 'Goal not found' });
    if (goal.userId !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    const newSavedAmount = Math.min(goal.targetAmount, goal.savedAmount + contribution);
    const updated = await Goal.findByIdAndUpdate(req.params.id, { savedAmount: newSavedAmount }, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Contribute goal error:', err.message);
    res.status(500).send('Server error');
  }
});

// PUT update a goal
router.put('/:id', auth, async (req, res) => {
  const { title, targetAmount, savedAmount, deadline, icon, color } = req.body;
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ msg: 'Goal not found' });
    if (goal.userId !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (targetAmount !== undefined) updates.targetAmount = Number(targetAmount);
    if (savedAmount !== undefined) updates.savedAmount = Number(savedAmount);
    if (deadline !== undefined) updates.deadline = deadline ? new Date(deadline) : null;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;

    const updated = await Goal.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Update goal error:', err.message);
    res.status(500).send('Server error');
  }
});

// DELETE a goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ msg: 'Goal not found' });
    if (goal.userId !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    await Goal.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Goal removed' });
  } catch (err) {
    console.error('Delete goal error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

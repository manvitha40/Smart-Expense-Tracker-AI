const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User } = require('../config/db');
const fs = require('fs');
const path = require('path');

// Helper to read/write goals from JSON db
const DATA_DIR = path.join(__dirname, '..', 'data');
const GOALS_FILE = path.join(DATA_DIR, 'goals.json');

function readGoals() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(GOALS_FILE)) fs.writeFileSync(GOALS_FILE, '[]');
  try {
    return JSON.parse(fs.readFileSync(GOALS_FILE, 'utf8'));
  } catch { return []; }
}

function writeGoals(goals) {
  fs.writeFileSync(GOALS_FILE, JSON.stringify(goals, null, 2));
}

function generateId() {
  return [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

// GET all goals for user
router.get('/', auth, (req, res) => {
  try {
    const goals = readGoals().filter(g => g.userId === req.user.id);
    res.json(goals);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// POST create a new goal
router.post('/', auth, (req, res) => {
  const { title, targetAmount, deadline, icon, color } = req.body;
  if (!title || !targetAmount) return res.status(400).json({ msg: 'Title and target amount required' });

  try {
    const goals = readGoals();
    const newGoal = {
      _id: generateId(),
      userId: req.user.id,
      title,
      targetAmount: Number(targetAmount),
      savedAmount: 0,
      deadline: deadline || null,
      icon: icon || '🎯',
      color: color || '#0D9488',
      createdAt: new Date().toISOString()
    };
    goals.push(newGoal);
    writeGoals(goals);
    res.json(newGoal);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// PUT add savings to a goal
router.put('/:id/contribute', auth, (req, res) => {
  const { amount } = req.body;
  try {
    const goals = readGoals();
    const idx = goals.findIndex(g => g._id === req.params.id && g.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ msg: 'Goal not found' });

    goals[idx].savedAmount = Math.min(goals[idx].targetAmount, goals[idx].savedAmount + Number(amount));
    writeGoals(goals);
    res.json(goals[idx]);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// PUT update a goal
router.put('/:id', auth, (req, res) => {
  const { title, targetAmount, savedAmount, deadline, icon, color } = req.body;
  try {
    const goals = readGoals();
    const idx = goals.findIndex(g => g._id === req.params.id && g.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ msg: 'Goal not found' });

    if (title !== undefined) goals[idx].title = title;
    if (targetAmount !== undefined) goals[idx].targetAmount = Number(targetAmount);
    if (savedAmount !== undefined) goals[idx].savedAmount = Number(savedAmount);
    if (deadline !== undefined) goals[idx].deadline = deadline;
    if (icon !== undefined) goals[idx].icon = icon;
    if (color !== undefined) goals[idx].color = color;

    writeGoals(goals);
    res.json(goals[idx]);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// DELETE a goal
router.delete('/:id', auth, (req, res) => {
  try {
    const goals = readGoals();
    const filtered = goals.filter(g => !(g._id === req.params.id && g.userId === req.user.id));
    writeGoals(filtered);
    res.json({ msg: 'Goal removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;

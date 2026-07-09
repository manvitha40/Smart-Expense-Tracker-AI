const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User, Expense, Income } = require('../config/db');
const { sendBudgetAlert, sendWeeklySummary } = require('../services/emailService');

// @route   POST /api/notifications/test-email
// @desc    Send a test budget alert email to the logged-in user
// @access  Private
router.post('/test-email', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!user.notifications?.emailAlerts) {
      return res.status(400).json({ msg: 'Email alerts are disabled in your settings.' });
    }

    const now = new Date();
    const expenses = await Expense.find({ userId: req.user.id });
    const currentMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalSpent = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
    const budget = user.monthlyBudget || 0;

    if (!budget) {
      return res.status(400).json({ msg: 'Please set a monthly budget in your profile settings first.' });
    }

    const sent = await sendBudgetAlert({
      toEmail: user.email,
      name: user.name,
      spent: totalSpent,
      budget,
      currency: user.currency || 'INR'
    });

    if (sent) {
      res.json({ msg: `Test budget alert sent to ${user.email}` });
    } else {
      res.status(500).json({ msg: 'Email service not configured. Add EMAIL_USER and EMAIL_PASS to your environment variables.' });
    }
  } catch (err) {
    console.error('Test email error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/notifications/send-weekly
// @desc    Manually trigger a weekly summary email
// @access  Private
router.post('/send-weekly', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const expenses = await Expense.find({ userId: req.user.id });
    const incomes = await Income.find({ userId: req.user.id });

    const weekExpenses = expenses.filter(e => new Date(e.date) >= oneWeekAgo);
    const weekIncomes = incomes.filter(i => new Date(i.date) >= oneWeekAgo);

    const totalExpense = weekExpenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = weekIncomes.reduce((s, i) => s + i.amount, 0);
    const totalSavings = totalIncome - totalExpense;

    // Top categories
    const categoryMap = {};
    weekExpenses.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const topCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, total]) => ({ name, total }));

    const sent = await sendWeeklySummary({
      toEmail: user.email,
      name: user.name,
      currency: user.currency || 'INR',
      totalIncome,
      totalExpense,
      totalSavings,
      topCategories
    });

    if (sent) {
      res.json({ msg: `Weekly summary sent to ${user.email}` });
    } else {
      res.status(500).json({ msg: 'Email service not configured. Add EMAIL_USER and EMAIL_PASS to your environment variables.' });
    }
  } catch (err) {
    console.error('Weekly email error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

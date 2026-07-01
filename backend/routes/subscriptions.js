const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Expense } = require('../config/db');

// @route   GET api/subscriptions
// @desc    Auto-detect recurring subscription expenses + manual list
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id });

    // Group by merchant name
    const merchantMap = {};
    expenses.forEach(exp => {
      const key = (exp.merchant || '').toLowerCase().trim();
      if (!key) return;
      if (!merchantMap[key]) {
        merchantMap[key] = { 
          name: exp.merchant, 
          category: exp.category,
          transactions: [] 
        };
      }
      merchantMap[key].transactions.push({ amount: exp.amount, date: exp.date });
    });

    const subscriptions = [];
    
    // Detect recurring: same merchant appearing in 2+ different months
    for (const key in merchantMap) {
      const { name, category, transactions } = merchantMap[key];
      if (transactions.length < 2) continue;

      const months = new Set(transactions.map(t => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      }));

      if (months.size >= 2) {
        // Calculate average amount
        const avgAmount = Math.round(
          transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
        );

        // Get latest payment date
        const latestDate = transactions
          .map(t => new Date(t.date))
          .sort((a, b) => b - a)[0];

        // Calculate projected next renewal (30 days from last)
        const nextRenewal = new Date(latestDate);
        nextRenewal.setDate(nextRenewal.getDate() + 30);

        subscriptions.push({
          name,
          category,
          avgAmount,
          occurrences: transactions.length,
          latestDate: latestDate.toISOString(),
          nextRenewal: nextRenewal.toISOString(),
          daysUntilRenewal: Math.max(0, Math.ceil((nextRenewal - new Date()) / (1000 * 60 * 60 * 24)))
        });
      }
    }

    // Sort by days until renewal (soonest first)
    subscriptions.sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);

    const totalMonthlyOverhead = subscriptions.reduce((sum, s) => sum + s.avgAmount, 0);

    res.json({ subscriptions, totalMonthlyOverhead });
  } catch (err) {
    console.error('Subscription detection error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

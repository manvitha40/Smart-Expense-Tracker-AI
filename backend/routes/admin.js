const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User, Expense, Income, Notification } = require('../config/db');

// Admin check middleware
const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// @route   GET /api/admin/stats
// @desc    Get platform-wide statistics (admin only)
// @access  Private + Admin
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const [users, expenses, incomes] = await Promise.all([
      User.find({}).select('-password'),
      Expense.find({}),
      Income.find({})
    ]);

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncomes = incomes.reduce((s, i) => s + i.amount, 0);

    // Per-month aggregation (last 6 months)
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });

      const monthExp = expenses.filter(e => {
        const ed = new Date(e.date);
        return ed.getMonth() === m && ed.getFullYear() === y;
      }).reduce((s, e) => s + e.amount, 0);

      const monthInc = incomes.filter(inc => {
        const id = new Date(inc.date);
        return id.getMonth() === m && id.getFullYear() === y;
      }).reduce((s, inc) => s + inc.amount, 0);

      months.push({ label, expenses: Math.round(monthExp), income: Math.round(monthInc) });
    }

    // Category breakdown
    const categoryMap = {};
    expenses.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const topCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, total]) => ({ name, total: Math.round(total) }));

    // Recent signups (last 5 users)
    const recentUsers = [...users]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        currency: u.currency,
        createdAt: u.createdAt,
        profileImage: u.profileImage
      }));

    res.json({
      overview: {
        totalUsers: users.length,
        totalExpenses: Math.round(totalExpenses),
        totalIncomes: Math.round(totalIncomes),
        totalTransactions: expenses.length + incomes.length,
        avgExpensePerUser: users.length > 0 ? Math.round(totalExpenses / users.length) : 0
      },
      monthlyTrends: months,
      topCategories,
      recentUsers
    });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/admin/users
// @desc    Get all users list
// @access  Private + Admin
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private + Admin
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    // Optionally clean up their data
    await Expense.deleteMany({ userId: req.params.id });
    await Income.deleteMany({ userId: req.params.id });
    res.json({ msg: 'User and their data removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Toggle admin role for a user
// @access  Private + Admin
router.put('/users/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();
    res.json({ msg: `User role updated to ${user.role}`, role: user.role });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;

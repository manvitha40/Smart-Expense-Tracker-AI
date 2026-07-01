const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Income, Expense, User } = require('../config/db');

// @route   GET api/reports
// @desc    Get financial reports based on period (daily, weekly, monthly, yearly)
// @access  Private
router.get('/', auth, async (req, res) => {
  const { period = 'monthly', month, year } = req.query;

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const incomes = await Income.find({ userId });
    const expenses = await Expense.find({ userId });

    const now = new Date();
    const activeMonth = month !== undefined ? parseInt(month) : now.getMonth(); // 0-11
    const activeYear = year !== undefined ? parseInt(year) : now.getFullYear();

    // Filter data based on selected period
    let filteredExpenses = [];
    let filteredIncomes = [];
    let daysCount = 30; // default average denominator

    if (period === 'daily') {
      // Last 24 hours
      const targetDate = new Date();
      targetDate.setHours(0,0,0,0);
      filteredExpenses = expenses.filter(e => new Date(e.date) >= targetDate);
      filteredIncomes = incomes.filter(i => new Date(i.date) >= targetDate);
      daysCount = 1;
    } else if (period === 'weekly') {
      // Last 7 days
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 7);
      filteredExpenses = expenses.filter(e => new Date(e.date) >= targetDate);
      filteredIncomes = incomes.filter(i => new Date(i.date) >= targetDate);
      daysCount = 7;
    } else if (period === 'yearly') {
      // Selected Year
      filteredExpenses = expenses.filter(e => new Date(e.date).getFullYear() === activeYear);
      filteredIncomes = incomes.filter(i => new Date(i.date).getFullYear() === activeYear);
      daysCount = 365;
    } else {
      // Monthly (Default)
      filteredExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === activeMonth && d.getFullYear() === activeYear;
      });
      filteredIncomes = incomes.filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === activeMonth && d.getFullYear() === activeYear;
      });
      // Get number of days in active month
      daysCount = new Date(activeYear, activeMonth + 1, 0).getDate();
    }

    const totalIncome = filteredIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    const savings = totalIncome - totalExpense;

    // Highest Expense Category
    const categoryMap = {};
    filteredExpenses.forEach(exp => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });

    let highestExpenseCategory = 'N/A';
    let highestExpenseCategoryAmount = 0;
    for (let cat in categoryMap) {
      if (categoryMap[cat] > highestExpenseCategoryAmount) {
        highestExpenseCategory = cat;
        highestExpenseCategoryAmount = categoryMap[cat];
      }
    }

    // Most Expensive Day
    const dayMap = {};
    filteredExpenses.forEach(exp => {
      const dateString = new Date(exp.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      dayMap[dateString] = (dayMap[dateString] || 0) + exp.amount;
    });

    let mostExpensiveDay = 'N/A';
    let mostExpensiveDayAmount = 0;
    for (let day in dayMap) {
      if (dayMap[day] > mostExpensiveDayAmount) {
        mostExpensiveDay = day;
        mostExpensiveDayAmount = dayMap[day];
      }
    }

    // Averages
    const averageDailySpending = Math.round(totalExpense / daysCount);
    const averageWeeklySpending = Math.round(totalExpense / (daysCount / 7));

    // Category Breakdown list for reports table
    const categoryBreakdown = Object.keys(categoryMap).map(name => ({
      name,
      amount: categoryMap[name],
      percentage: totalExpense > 0 ? Math.round((categoryMap[name] / totalExpense) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    res.json({
      period,
      currency: user.currency,
      totalIncome,
      totalExpense,
      savings,
      highestExpenseCategory,
      highestExpenseCategoryAmount,
      mostExpensiveDay,
      mostExpensiveDayAmount,
      averageDailySpending,
      averageWeeklySpending,
      categoryBreakdown,
      transactionsCount: filteredExpenses.length
    });

  } catch (err) {
    console.error('Reports calculation error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

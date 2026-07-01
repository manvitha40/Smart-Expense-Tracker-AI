const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Income, Expense, User } = require('../config/db');

// @route   GET api/dashboard
// @desc    Get dashboard summary statistics & chart datasets
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const incomes = await Income.find({ userId });
    const expenses = await Expense.find({ userId });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Lifetime Stats
    const totalLifetimeIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalLifetimeExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalLifetimeIncome - totalLifetimeExpense;

    // Current Month Stats
    const monthlyIncomes = incomes.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthlyExpenses = expenses.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalMonthlyIncome = monthlyIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalMonthlyExpense = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
    const monthlySavings = totalMonthlyIncome - totalMonthlyExpense;

    const monthlyBudget = user.monthlyBudget || 0;
    const budgetRemaining = Math.max(0, monthlyBudget - totalMonthlyExpense);
    const budgetUsagePercent = monthlyBudget > 0 ? Math.round((totalMonthlyExpense / monthlyBudget) * 100) : 0;

    // Recent Transactions (Combine and sort)
    const formattedIncomes = incomes.map(item => ({
      _id: item._id,
      amount: item.amount,
      type: 'income',
      category: 'Income',
      merchant: item.source,
      description: item.description,
      date: item.date,
      paymentMethod: 'Direct Deposit'
    }));

    const formattedExpenses = expenses.map(item => ({
      _id: item._id,
      amount: item.amount,
      type: 'expense',
      category: item.category,
      merchant: item.merchant,
      description: item.description,
      date: item.date,
      paymentMethod: item.paymentMethod,
      receiptImage: item.receiptImage
    }));

    const allTransactions = [...formattedIncomes, ...formattedExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Chart Data 1: Category Distribution (Current Month Pie Chart)
    const categoryMap = {};
    monthlyExpenses.forEach(exp => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });
    const categoryDistribution = Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name]
    })).sort((a, b) => b.value - a.value);

    // Chart Data 2 & 3: Last 6 Months (Monthly Expense Bar Chart & Savings Trend Line Chart)
    const monthlyTrend = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const mNum = d.getMonth();
      const yNum = d.getFullYear();
      
      const label = `${months[mNum]} ${yNum.toString().slice(-2)}`;

      const mIncomes = incomes.filter(item => {
        const itemD = new Date(item.date);
        return itemD.getMonth() === mNum && itemD.getFullYear() === yNum;
      });

      const mExpenses = expenses.filter(item => {
        const itemD = new Date(item.date);
        return itemD.getMonth() === mNum && itemD.getFullYear() === yNum;
      });

      const totalInc = mIncomes.reduce((sum, item) => sum + item.amount, 0);
      const totalExp = mExpenses.reduce((sum, item) => sum + item.amount, 0);
      const savings = totalInc - totalExp;

      monthlyTrend.push({
        month: label,
        income: totalInc,
        expense: totalExp,
        savings: savings
      });
    }

    res.json({
      currency: user.currency,
      stats: {
        totalIncome: totalMonthlyIncome,
        totalExpense: totalMonthlyExpense,
        balance: balance,
        savings: monthlySavings,
        monthlyBudget,
        budgetRemaining,
        budgetUsagePercent
      },
      recentTransactions: allTransactions,
      charts: {
        categoryDistribution,
        monthlyTrend
      }
    });

  } catch (err) {
    console.error('Fetch dashboard error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

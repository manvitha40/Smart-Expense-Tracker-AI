const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { Expense, User, Notification } = require('../config/db');

// Configure Multer for Receipt Uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

// Helper: Check budget threshold and generate notifications
async function checkBudgetAlerts(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.monthlyBudget) return;

    const monthlyBudget = user.monthlyBudget;
    
    // Find expenses for current month
    const expenses = await Expense.find({ userId });
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });

    const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const usagePercent = (totalSpent / monthlyBudget) * 100;

    // Check if exceeded or warning needed
    if (totalSpent > monthlyBudget) {
      const message = `Budget Exceeded! You have spent ${user.currency === 'INR' ? '₹' : '$'}${totalSpent.toLocaleString()} of your ${user.currency === 'INR' ? '₹' : '$'}${monthlyBudget.toLocaleString()} budget. Reduce your spending.`;
      // Check if duplicate notification exists for today to avoid spamming
      const existing = await Notification.find({ userId, type: 'budget_exceed' });
      const todayString = new Date().toDateString();
      const hasToday = existing.some(n => new Date(n.createdAt).toDateString() === todayString);
      
      if (!hasToday) {
        await Notification.create({
          userId,
          type: 'budget_exceed',
          message,
          read: false
        });
      }
    } else if (usagePercent >= 90) {
      const message = `Warning! ${Math.round(usagePercent)}% of your monthly budget has been used (${user.currency === 'INR' ? '₹' : '$'}${totalSpent.toLocaleString()} spent of ${user.currency === 'INR' ? '₹' : '$'}${monthlyBudget.toLocaleString()}).`;
      const existing = await Notification.find({ userId, type: 'budget_warn' });
      const todayString = new Date().toDateString();
      const hasToday = existing.some(n => new Date(n.createdAt).toDateString() === todayString);

      if (!hasToday) {
        await Notification.create({
          userId,
          type: 'budget_warn',
          message,
          read: false
        });
      }
    }
  } catch (err) {
    console.error('Error checking budget alerts:', err.message);
  }
}

// @route   POST api/expenses
// @desc    Create an expense
// @access  Private
router.post('/', [auth, upload.single('receipt')], async (req, res) => {
  const { amount, merchant, category, description, paymentMethod, date, isRecurring, recurrence } = req.body;

  try {
    let receiptImage = '';
    if (req.file) {
      receiptImage = `/uploads/${req.file.filename}`;
    } else if (req.body.receiptImage) {
      receiptImage = req.body.receiptImage;
    }

    const newExpense = await Expense.create({
      userId: req.user.id,
      amount: Number(amount),
      merchant: merchant || '',
      category: category || 'Others',
      description: description || '',
      paymentMethod: paymentMethod || 'Cash',
      receiptImage: receiptImage,
      isRecurring: isRecurring === 'true' || isRecurring === true,
      recurrence: recurrence || 'none',
      date: date ? new Date(date) : new Date()
    });

    // Check budget thresholds asynchronously
    checkBudgetAlerts(req.user.id);

    res.json(newExpense);
  } catch (err) {
    console.error('Add expense error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/expenses
// @desc    Get all expenses for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id });
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(expenses);
  } catch (err) {
    console.error('Get expenses error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', [auth, upload.single('receipt')], async (req, res) => {
  const { amount, merchant, category, description, paymentMethod, date, isRecurring, recurrence } = req.body;

  try {
    let expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    if (String(expense.userId) !== String(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    let receiptImage = expense.receiptImage;
    if (req.file) {
      receiptImage = `/uploads/${req.file.filename}`;
    }

    const updates = {
      amount: amount !== undefined ? Number(amount) : expense.amount,
      merchant: merchant !== undefined ? merchant : expense.merchant,
      category: category || expense.category,
      description: description !== undefined ? description : expense.description,
      paymentMethod: paymentMethod || expense.paymentMethod,
      receiptImage: receiptImage,
      isRecurring: isRecurring !== undefined ? (isRecurring === 'true' || isRecurring === true) : expense.isRecurring,
      recurrence: recurrence !== undefined ? recurrence : expense.recurrence,
      date: date ? new Date(date) : expense.date
    };

    expense = await Expense.findByIdAndUpdate(req.params.id, updates, { new: true });
    
    // Check budget thresholds
    checkBudgetAlerts(req.user.id);

    res.json(expense);
  } catch (err) {
    console.error('Update expense error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    if (String(expense.userId) !== String(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Expense removed' });
  } catch (err) {
    console.error('Delete expense error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

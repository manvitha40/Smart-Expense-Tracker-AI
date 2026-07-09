const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const auth = require('../middleware/auth');
const { Expense, User } = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configure Multer for CSV Uploads
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

const upload = multer({ storage: storage });

// Helper: Local fallback categorizer
function fallbackCategorize(merchant) {
  const m = (merchant || '').toLowerCase();
  if (m.includes('swiggy') || m.includes('zomato') || m.includes('restaurant') || m.includes('food') || m.includes('cafe') || m.includes('pizza') || m.includes('burger')) {
    return 'Food';
  }
  if (m.includes('uber') || m.includes('ola') || m.includes('travel') || m.includes('flight') || m.includes('railway') || m.includes('metro') || m.includes('cab') || m.includes('taxi')) {
    return 'Travel';
  }
  if (m.includes('amazon') || m.includes('flipkart') || m.includes('myntra') || m.includes('shopping') || m.includes('mall') || m.includes('clothing') || m.includes('fashion')) {
    return 'Shopping';
  }
  if (m.includes('pharmacy') || m.includes('hospital') || m.includes('medical') || m.includes('doctor') || m.includes('medicine') || m.includes('health')) {
    return 'Medicine';
  }
  if (m.includes('rent') || m.includes('pg') || m.includes('house') || m.includes('apartment')) {
    return 'Rent';
  }
  if (m.includes('electricity') || m.includes('water') || m.includes('gas') || m.includes('bill') || m.includes('phone') || m.includes('mobile') || m.includes('recharge')) {
    return 'Bills';
  }
  if (m.includes('netflix') || m.includes('spotify') || m.includes('youtube') || m.includes('prime') || m.includes('disney') || m.includes('hulu') || m.includes('subscription')) {
    return 'Subscriptions';
  }
  return 'Others';
}

// Helper: AI Categorizer via Gemini
async function aiCategorize(merchant, apiKey) {
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return fallbackCategorize(merchant);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Classify this merchant/transaction description "${merchant}" into exactly one of the following budget categories: Food, Travel, Shopping, Medicine, Rent, Bills, Subscriptions, Others. Return only the single category name word with no explanations or punctuation.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cat = response.text().trim();

    const validCategories = ['Food', 'Travel', 'Shopping', 'Medicine', 'Rent', 'Bills', 'Subscriptions', 'Others'];
    if (validCategories.includes(cat)) {
      return cat;
    }
    return fallbackCategorize(merchant);
  } catch (err) {
    console.error('Gemini classification error, falling back:', err.message);
    return fallbackCategorize(merchant);
  }
}

// @route   POST api/import/csv
// @desc    Upload bank statement CSV and auto-create categorized expenses
// @access  Private
router.post('/csv', [auth, upload.single('file')], async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a CSV file' });
  }

  const results = [];
  const filePath = req.file.path;
  const user = await User.findById(req.user.id);
  const apiKey = process.env.GEMINI_API_KEY;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      // Normalize keys to lowercase for standard mapping
      const row = {};
      Object.keys(data).forEach(key => {
        row[key.toLowerCase().trim()] = data[key];
      });
      results.push(row);
    })
    .on('end', async () => {
      try {
        let importedCount = 0;
        const createdExpenses = [];

        for (const row of results) {
          // Identify columns dynamically
          const dateStr = row.date || row.transaction_date || row.time || new Date().toISOString();
          const merchantStr = row.merchant || row.description || row.payee || row.vendor || 'Unknown Merchant';
          const amountVal = Number(String(row.amount || row.spent || row.value).replace(/[^0-9.-]+/g, ''));

          if (isNaN(amountVal) || amountVal <= 0) continue;

          // Categorize
          const category = await aiCategorize(merchantStr, apiKey);

          const newExp = await Expense.create({
            userId: req.user.id,
            amount: amountVal,
            merchant: merchantStr,
            category: category,
            description: `Imported from CSV statement`,
            paymentMethod: row.payment_method || row.paymentmethod || row.type || 'Others',
            isRecurring: false,
            recurrence: 'none',
            date: new Date(dateStr)
          });

          createdExpenses.push(newExp);
          importedCount++;
        }

        // Cleanup uploaded file
        fs.unlinkSync(filePath);

        res.json({
          msg: `Successfully imported ${importedCount} expenses from bank statement.`,
          count: importedCount
        });
      } catch (err) {
        console.error('CSV import save error:', err.message);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: 'Failed to save imported expenses' });
      }
    })
    .on('error', (err) => {
      console.error('CSV parsing error:', err.message);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.status(500).json({ error: 'Failed to parse CSV statement' });
    });
});

module.exports = router;

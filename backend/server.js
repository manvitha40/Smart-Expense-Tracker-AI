const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');

const app = express();

// Connect to Database (with JSON fallback)
connectDB().then(() => {
  const { seedDemoData } = require('./controllers/initController');
  seedDemoData(false);
  const { startRecurringScheduler } = require('./services/recurringService');
  startRecurringScheduler();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded receipt files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/income', require('./routes/income'));
app.use('/api/expenses', require('./routes/expense'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/import', require('./routes/import'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/init', require('./routes/init'));
app.use('/api/email-notifications', require('./routes/emailNotifications'));

// Root Route
app.get('/', (req, res) => {
  res.send('Smart Expense Tracker AI API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: err.message || 'Something went wrong on the server!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

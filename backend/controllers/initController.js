const bcrypt = require('bcryptjs');
const { User, Income, Expense, Category, Notification, Goal } = require('../config/db');

async function seedDemoData(force = false) {
  try {
    const demoEmail = 'guest@example.com';
    let demoUser = await User.findOne({ email: demoEmail });

    if (demoUser && !force) {
      // Always patch name + avatar in case they are outdated
      await User.findByIdAndUpdate(demoUser._id || demoUser.id, {
        name: 'Manvitha',
        profileImage: 'https://ui-avatars.com/api/?name=M&background=7C3AED&color=fff&size=150&bold=true&font-size=0.5',
        role: 'admin'
      });
      console.log('✅ Demo user profile patched (Manvitha) with admin privileges. Skipping full re-seed.');
      return;
    }

    console.log('🌱 Seeding demo data...');

    if (demoUser) {
      console.log('🧹 Cleaning old demo user data...');
      const uid = demoUser._id || demoUser.id;
      await Income.deleteMany({ userId: uid });
      await Expense.deleteMany({ userId: uid });
      await Category.deleteMany({ userId: uid });
      await Notification.deleteMany({ userId: uid });
      await Goal.deleteMany({ userId: uid });
      await User.findByIdAndDelete(uid);
    }

    // Create demo user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('guest123', salt);

    demoUser = await User.create({
      name: 'Manvitha',
      email: demoEmail,
      password: hashedPassword,
      profileImage: 'https://ui-avatars.com/api/?name=M&background=7C3AED&color=fff&size=150&bold=true&font-size=0.5',
      monthlyBudget: 50000,
      currency: 'INR',
      theme: 'light',
      role: 'admin',
      notifications: {
        budgetAlerts: true,
        emailAlerts: true
      }
    });

    const uid = demoUser._id || demoUser.id;
    console.log(`👤 Created demo user with ID: ${uid}`);

    // Create default categories
    const categoriesList = [
      { name: 'Food', color: '#EF4444', icon: 'Utensils' },
      { name: 'Travel', color: '#3B82F6', icon: 'Car' },
      { name: 'Shopping', color: '#EC4899', icon: 'ShoppingBag' },
      { name: 'Medicine', color: '#10B981', icon: 'Activity' },
      { name: 'Rent', color: '#F59E0B', icon: 'Home' },
      { name: 'Bills', color: '#8B5CF6', icon: 'Zap' },
      { name: 'Subscriptions', color: '#6366F1', icon: 'Tv' },
      { name: 'Others', color: '#6B7280', icon: 'Tag' }
    ];

    for (let cat of categoriesList) {
      await Category.create({
        userId: uid,
        ...cat
      });
    }

    // Generate Income & Expense History (last 6 months)
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      // Salary
      await Income.create({
        userId: uid,
        amount: 75000,
        source: 'TechCorp Salary',
        description: 'Monthly salary credit',
        date: date.toISOString()
      });

      // Freelancing
      const freelanceDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
      await Income.create({
        userId: uid,
        amount: 15000,
        source: 'Upwork Freelance',
        description: 'Web development services',
        date: freelanceDate.toISOString()
      });
    }

    // Bonus for current month
    await Income.create({
      userId: uid,
      amount: 8000,
      source: 'Quarterly Bonus',
      description: 'TechCorp performance bonus',
      date: new Date(now.getFullYear(), now.getMonth(), 20).toISOString()
    });

    // Seed Expenses
    const expenseTemplates = [
      { category: 'Rent', amount: 12000, merchant: 'Landlord', description: 'Apartment rent', day: 5 },
      { category: 'Bills', amount: 2200, merchant: 'PowerCorp', description: 'Electricity bill', day: 10 },
      { category: 'Bills', amount: 999, merchant: 'Airtel Broadband', description: 'Internet connection', day: 12 },
      { category: 'Subscriptions', amount: 649, merchant: 'Netflix India', description: 'Premium subscription plan', day: 18 },
      { category: 'Subscriptions', amount: 120, merchant: 'Spotify India', description: 'Premium music streaming', day: 22 }
    ];

    const randomTransactions = [
      { category: 'Food', merchant: 'Pizza Hut', descPrefix: 'Dinner with friends', min: 400, max: 1200 },
      { category: 'Food', merchant: 'Swiggy', descPrefix: 'Lunch delivery', min: 250, max: 600 },
      { category: 'Food', merchant: 'Zomato', descPrefix: 'Weekend dinner', min: 500, max: 1500 },
      { category: 'Food', merchant: 'Local Grocery Store', descPrefix: 'Weekly provisions', min: 800, max: 2500 },
      
      { category: 'Travel', merchant: 'Petrol Pump', descPrefix: 'Fuel top-up', min: 1000, max: 2500 },
      { category: 'Travel', merchant: 'Uber India', descPrefix: 'Commute to office', min: 200, max: 650 },
      
      { category: 'Shopping', merchant: 'Amazon', descPrefix: 'Gadgets/Books order', min: 1500, max: 7000 },
      { category: 'Shopping', merchant: 'Myntra', descPrefix: 'Summer clothes shopping', min: 1000, max: 3500 },
      
      { category: 'Medicine', merchant: 'Apollo Pharmacy', descPrefix: 'Regular supplements', min: 300, max: 1500 },
      
      { category: 'Others', merchant: 'Starbucks', descPrefix: 'Coffee and cookie', min: 350, max: 750 }
    ];

    for (let i = 5; i >= 0; i--) {
      // 1. Seed static fixed monthly expenses
      for (let template of expenseTemplates) {
        const expDate = new Date(now.getFullYear(), now.getMonth() - i, template.day);
        await Expense.create({
          userId: uid,
          amount: template.amount,
          merchant: template.merchant,
          category: template.category,
          description: template.description,
          paymentMethod: template.category === 'Rent' ? 'NetBanking' : 'Credit Card',
          receiptImage: '',
          date: expDate.toISOString()
        });
      }

      // 2. Seed randomized expenses
      const numRandomExpenses = 10 + Math.floor(Math.random() * 5); // 10-14 transactions
      for (let r = 0; r < numRandomExpenses; r++) {
        const randType = randomTransactions[Math.floor(Math.random() * randomTransactions.length)];
        const amount = Math.floor(Math.random() * (randType.max - randType.min + 1)) + randType.min;
        const day = 1 + Math.floor(Math.random() * 27);
        const expDate = new Date(now.getFullYear(), now.getMonth() - i, day);
        
        await Expense.create({
          userId: uid,
          amount: amount,
          merchant: randType.merchant,
          category: randType.category,
          description: randType.descPrefix,
          paymentMethod: Math.random() > 0.5 ? 'UPI' : (Math.random() > 0.5 ? 'Credit Card' : 'Cash'),
          receiptImage: '',
          date: expDate.toISOString()
        });
      }
    }

    // Seed Savings Goals
    await Goal.create({
      userId: uid,
      title: 'Europe Trip',
      targetAmount: 150000,
      savedAmount: 37500,
      deadline: new Date(now.getFullYear(), now.getMonth() + 4, 15).toISOString(),
      icon: '✈️',
      color: '#0D9488'
    });

    await Goal.create({
      userId: uid,
      title: 'Home Renovation',
      targetAmount: 200000,
      savedAmount: 80000,
      deadline: new Date(now.getFullYear(), now.getMonth() + 8, 1).toISOString(),
      icon: '🏠',
      color: '#059669'
    });

    await Goal.create({
      userId: uid,
      title: 'New Laptop',
      targetAmount: 80000,
      savedAmount: 48000,
      deadline: new Date(now.getFullYear(), now.getMonth() + 2, 10).toISOString(),
      icon: '💻',
      color: '#3B82F6'
    });

    // Seed Notifications
    await Notification.create({
      userId: uid,
      type: 'system',
      message: 'Welcome to Smart Expense Tracker AI! Try uploading a receipt under the Receipt Scanner tab.',
      read: false
    });

    await Notification.create({
      userId: uid,
      type: 'budget_warn',
      message: 'Warning! You have consumed 74% of your monthly budget.',
      read: true,
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3).toISOString()
    });

    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
}

module.exports = {
  seedDemoData,
  seedDemoDataEndpoint: async (req, res) => {
    try {
      await seedDemoData(true);
      res.json({ msg: 'Demo account re-seeded successfully with 6 months of data!' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reseed database' });
    }
  }
};

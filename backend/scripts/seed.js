const bcrypt = require('bcryptjs');
require('dotenv').config();
const { User, Income, Expense, Category, Notification, connectDB, getUseLocalJsonDb } = require('../config/db');

async function seed() {
  console.log('🌱 Starting database seeding...');
  
  // Make sure we connect first
  await connectDB();

  // 1. Clean existing records for the demo user
  const demoEmail = 'demo@example.com';
  let demoUser = await User.findOne({ email: demoEmail });
  
  if (demoUser) {
    console.log('🧹 Cleaning old demo user data...');
    const uid = demoUser._id;
    await Income.deleteMany({ userId: uid });
    await Expense.deleteMany({ userId: uid });
    await Category.deleteMany({ userId: uid });
    await Notification.deleteMany({ userId: uid });
    await User.deleteMany({ email: demoEmail });
  }

  // 2. Create demo user
  console.log('👤 Creating demo user...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  demoUser = await User.create({
    name: 'John Doe',
    email: demoEmail,
    password: hashedPassword,
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    monthlyBudget: 50000,
    currency: 'INR',
    theme: 'light',
    notifications: {
      budgetAlerts: true,
      emailAlerts: true
    }
  });

  const uid = demoUser._id;
  console.log(`✅ Demo user created: ${demoUser.name} (${demoUser.email})`);

  // 3. Create default categories
  console.log('📂 Seeding categories...');
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
  console.log('✅ Categories seeded.');

  // 4. Generate Income History (last 6 months)
  console.log('💰 Seeding income logs...');
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

  console.log('✅ Income logs seeded.');

  // 5. Generate Expense History (last 6 months)
  console.log('💳 Seeding expense logs...');
  const expenseTemplates = [
    { category: 'Rent', amount: 12000, merchant: 'Landlord', description: 'Apartment rent', day: 5 },
    { category: 'Bills', amount: 2200, merchant: 'PowerCorp', description: 'Electricity bill', day: 10 },
    { category: 'Bills', amount: 999, merchant: 'Airtel Broadband', description: 'Internet connection', day: 12 },
    { category: 'Subscriptions', amount: 649, merchant: 'Netflix India', description: 'Premium subscription plan', day: 18 },
    { category: 'Subscriptions', amount: 120, merchant: 'Spotify India', description: 'Premium music streaming', day: 22 }
  ];

  // Feed variable transactions
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

  // Seed expenses for last 6 months
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
    const numRandomExpenses = 10 + Math.floor(Math.random() * 5); // 10-14 random transactions per month
    for (let r = 0; r < numRandomExpenses; r++) {
      const randType = randomTransactions[Math.floor(Math.random() * randomTransactions.length)];
      const amount = Math.floor(Math.random() * (randType.max - randType.min + 1)) + randType.min;
      const day = 1 + Math.floor(Math.random() * 27); // avoid 31st/29th issues
      const expDate = new Date(now.getFullYear(), now.getMonth() - i, day);
      
      await Expense.create({
        userId: uid,
        amount: amount,
        merchant: randType.merchant,
        category: randType.category,
        description: `${randType.descPrefix}`,
        paymentMethod: Math.random() > 0.5 ? 'UPI' : (Math.random() > 0.5 ? 'Credit Card' : 'Cash'),
        receiptImage: '',
        date: expDate.toISOString()
      });
    }
  }

  console.log('✅ Expense logs seeded.');

  // 6. Generate Alerts/Notifications
  console.log('🔔 Seeding notifications...');
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

  console.log('✅ Notifications seeded.');
  console.log('\n⭐ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`👉 You can log in using:`);
  console.log(`   Email:    demo@example.com`);
  console.log(`   Password: password123`);
  
  if (getUseLocalJsonDb()) {
    console.log('💾 File saved to local storage: backend/data/db.json');
  }

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

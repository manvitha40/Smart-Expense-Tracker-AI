const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const JSON_DB_DIR = path.join(__dirname, '..', 'data');
const JSON_DB_PATH = path.join(JSON_DB_DIR, 'db.json');

let useLocalJsonDb = false;

// Ensure local db directory and file exist
function initLocalJsonDb() {
  if (!fs.existsSync(JSON_DB_DIR)) {
    fs.mkdirSync(JSON_DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(JSON_DB_PATH)) {
    const initialData = {
      users: [],
      incomes: [],
      expenses: [],
      categories: [],
      budgets: [],
      notifications: [],
      goals: []
    };
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

// Local JSON DB Helper
const jsonDb = {
  read() {
    initLocalJsonDb();
    try {
      const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading JSON DB, resetting:', err);
      const initialData = { users: [], incomes: [], expenses: [], categories: [], budgets: [], notifications: [], goals: [] };
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
  },
  write(data) {
    initLocalJsonDb();
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
  }
};

// Database Connection function
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️ No MONGODB_URI environment variable found.');
    console.log('👉 Falling back to local JSON database storage (backend/data/db.json).');
    useLocalJsonDb = true;
    initLocalJsonDb();
    return;
  }

  try {
    // Set a short timeout for connection
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('✅ MongoDB connected successfully.');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('👉 Falling back to local JSON database storage (backend/data/db.json).');
    useLocalJsonDb = true;
    initLocalJsonDb();
  }
};

// Mongoose Schemas (used when MongoDB is active)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: '' },
  monthlyBudget: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  theme: { type: String, default: 'light' },
  notifications: {
    budgetAlerts: { type: Boolean, default: true },
    emailAlerts: { type: Boolean, default: true }
  },
  role: { type: String, default: 'user' }, // 'user' | 'admin'
  createdAt: { type: Date, default: Date.now }
});

const IncomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  source: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  merchant: { type: String, default: '' },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  paymentMethod: { type: String, required: true },
  receiptImage: { type: String, default: '' },
  isRecurring: { type: Boolean, default: false },
  recurrence: { type: String, default: 'none' }, // 'none', 'weekly', 'monthly'
  date: { type: Date, default: Date.now }
});

const CategorySchema = new mongoose.Schema({
  userId: { type: String, required: true }, // User specific or 'system'
  name: { type: String, required: true },
  color: { type: String, default: '#0D9488' },
  icon: { type: String, default: 'Tag' }
});

const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  limit: { type: Number, required: true },
  category: { type: String, default: 'All' },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true }
});

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // 'budget_warn', 'budget_exceed', 'system'
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const GoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  deadline: { type: Date, default: null },
  icon: { type: String, default: '🎯' },
  color: { type: String, default: '#0D9488' },
  createdAt: { type: Date, default: Date.now }
});

// Mongoose Models
const MongoUser = mongoose.model('User', UserSchema);
const MongoIncome = mongoose.model('Income', IncomeSchema);
const MongoExpense = mongoose.model('Expense', ExpenseSchema);
const MongoCategory = mongoose.model('Category', CategorySchema);
const MongoBudget = mongoose.model('Budget', BudgetSchema);
const MongoNotification = mongoose.model('Notification', NotificationSchema);
const MongoGoal = mongoose.model('Goal', GoalSchema);

// Local JSON DB Model Implementation wrapper (mimics MongoDB Mongoose API)
class LocalModelWrapper {
  constructor(collectionName, mongoModel) {
    this.collection = collectionName;
    this.mongoModel = mongoModel;
  }

  get isLocal() {
    return useLocalJsonDb;
  }

  // Generate a random MongoDB-like hex ID
  generateId() {
    return [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  async find(query = {}) {
    if (!useLocalJsonDb) return this.mongoModel.find(query);
    
    const dbData = jsonDb.read();
    let items = dbData[this.collection] || [];
    
    // Simple filter matching
    return items.filter(item => {
      for (let key in query) {
        if (query[key] && typeof query[key] === 'object' && query[key].$gte) {
          const dateVal = new Date(item[key]);
          if (dateVal < new Date(query[key].$gte)) return false;
        } else if (query[key] && typeof query[key] === 'object' && query[key].$lte) {
          const dateVal = new Date(item[key]);
          if (dateVal > new Date(query[key].$lte)) return false;
        } else if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    }).map(item => ({ ...item, id: item._id }));
  }

  async findOne(query = {}) {
    if (!useLocalJsonDb) return this.mongoModel.findOne(query);
    const items = await this.find(query);
    return items[0] || null;
  }

  async findById(id) {
    if (!useLocalJsonDb) return this.mongoModel.findById(id);
    const dbData = jsonDb.read();
    const items = dbData[this.collection] || [];
    const item = items.find(x => x._id === String(id));
    return item ? { ...item, id: item._id } : null;
  }

  async create(data) {
    if (!useLocalJsonDb) return this.mongoModel.create(data);
    
    const dbData = jsonDb.read();
    if (!dbData[this.collection]) {
      dbData[this.collection] = [];
    }
    
    const newItem = {
      _id: this.generateId(),
      ...data,
      createdAt: new Date().toISOString()
    };
    
    dbData[this.collection].push(newItem);
    jsonDb.write(dbData);
    return { ...newItem, id: newItem._id };
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (!useLocalJsonDb) return this.mongoModel.findByIdAndUpdate(id, updateData, options);
    
    const dbData = jsonDb.read();
    const items = dbData[this.collection] || [];
    const idx = items.findIndex(x => x._id === String(id));
    if (idx === -1) return null;
    
    const updated = {
      ...items[idx],
      ...updateData
    };
    
    items[idx] = updated;
    jsonDb.write(dbData);
    return { ...updated, id: updated._id };
  }

  async findOneAndUpdate(query, updateData, options = {}) {
    if (!useLocalJsonDb) return this.mongoModel.findOneAndUpdate(query, updateData, options);
    
    const dbData = jsonDb.read();
    const items = dbData[this.collection] || [];
    
    // Find index
    const idx = items.findIndex(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (idx === -1) {
      if (options.upsert) {
        return this.create({ ...query, ...updateData });
      }
      return null;
    }

    const updated = {
      ...items[idx],
      ...updateData
    };
    
    items[idx] = updated;
    jsonDb.write(dbData);
    return { ...updated, id: updated._id };
  }

  async findByIdAndDelete(id) {
    if (!useLocalJsonDb) return this.mongoModel.findByIdAndDelete(id);
    
    const dbData = jsonDb.read();
    const items = dbData[this.collection] || [];
    const idx = items.findIndex(x => x._id === String(id));
    if (idx === -1) return null;
    
    const deleted = items.splice(idx, 1)[0];
    jsonDb.write(dbData);
    return { ...deleted, id: deleted._id };
  }

  async deleteMany(query = {}) {
    if (!useLocalJsonDb) return this.mongoModel.deleteMany(query);
    const dbData = jsonDb.read();
    let items = dbData[this.collection] || [];
    const remaining = items.filter(item => {
      for (let key in query) {
        if (item[key] === query[key]) return false;
      }
      return true;
    });
    dbData[this.collection] = remaining;
    jsonDb.write(dbData);
    return { deletedCount: items.length - remaining.length };
  }

  async countDocuments(query = {}) {
    if (!useLocalJsonDb) return this.mongoModel.countDocuments(query);
    const items = await this.find(query);
    return items.length;
  }
}

const User = new LocalModelWrapper('users', MongoUser);
const Income = new LocalModelWrapper('incomes', MongoIncome);
const Expense = new LocalModelWrapper('expenses', MongoExpense);
const Category = new LocalModelWrapper('categories', MongoCategory);
const Budget = new LocalModelWrapper('budgets', MongoBudget);
const Notification = new LocalModelWrapper('notifications', MongoNotification);
const Goal = new LocalModelWrapper('goals', MongoGoal);

module.exports = {
  connectDB,
  User,
  Income,
  Expense,
  Category,
  Budget,
  Notification,
  Goal,
  getUseLocalJsonDb: () => useLocalJsonDb
};

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { User } = require('../config/db');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, monthlyBudget, currency } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      monthlyBudget: monthlyBudget ? Number(monthlyBudget) : 0,
      currency: currency || 'INR',
      profileImage: '',
      theme: 'light',
      notifications: {
        budgetAlerts: true,
        emailAlerts: true
      }
    });

    const payload = {
      user: {
        id: user._id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            monthlyBudget: user.monthlyBudget,
            currency: user.currency,
            theme: user.theme,
            notifications: user.notifications
          }
        });
      }
    );
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user._id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            monthlyBudget: user.monthlyBudget,
            currency: user.currency,
            theme: user.theme,
            notifications: user.notifications
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user by token
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    // Omit password
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    console.error('Fetch user error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile settings
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, email, monthlyBudget, currency, theme, notifications, password, profileImage } = req.body;
  
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (monthlyBudget !== undefined) updates.monthlyBudget = Number(monthlyBudget);
    if (currency) updates.currency = currency;
    if (theme) updates.theme = theme;
    if (notifications) updates.notifications = notifications;
    if (profileImage !== undefined) updates.profileImage = profileImage;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ msg: 'User not found' });

    const userObj = updatedUser.toObject ? updatedUser.toObject() : { ...updatedUser };
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/toggle-role
// @desc    Toggle current user role between user and admin (for testing)
// @access  Private
router.post('/toggle-role', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();

    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;

    res.json({
      msg: `Your role was updated to: ${user.role}. Please refresh or update context.`,
      user: userObj
    });
  } catch (err) {
    console.error('Toggle role error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

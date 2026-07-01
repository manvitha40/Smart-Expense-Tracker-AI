const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Notification } = require('../config/db');

// @route   GET api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id });
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(notifications);
  } catch (err) {
    console.error('Fetch notifications error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/notifications/mark-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-read', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id });
    for (let notif of notifications) {
      if (!notif.read) {
        await Notification.findByIdAndUpdate(notif._id, { read: true });
      }
    }
    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark read error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ msg: 'Notification not found' });
    if (notif.userId !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

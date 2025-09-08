const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  message: String,
  type: String,
  date: Date,
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', NotificationSchema);

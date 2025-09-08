const mongoose = require('mongoose');

const MinuteSchema = new mongoose.Schema({
  title: String,
  content: String,
  date: Date,
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Minute', MinuteSchema);

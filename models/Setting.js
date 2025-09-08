const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: String,
  value: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Setting', SettingSchema);

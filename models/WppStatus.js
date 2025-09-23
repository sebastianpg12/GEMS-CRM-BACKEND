const mongoose = require('mongoose');

const WppStatusSchema = new mongoose.Schema({
  ready: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WppStatus', WppStatusSchema);
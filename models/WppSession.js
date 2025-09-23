const mongoose = require('mongoose');

const WppSessionSchema = new mongoose.Schema({
  session: { type: Object, default: {} },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WppSession', WppSessionSchema);
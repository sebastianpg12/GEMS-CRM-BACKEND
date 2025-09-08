const mongoose = require('mongoose');

const DocSchema = new mongoose.Schema({
  title: String,
  url: String,
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Doc', DocSchema);

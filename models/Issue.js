const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, default: 'open' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Issue', IssueSchema);

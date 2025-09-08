const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  amount: Number,
  dueDate: Date,
  status: { type: String, default: 'pending' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);

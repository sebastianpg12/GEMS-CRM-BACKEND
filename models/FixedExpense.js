const mongoose = require('mongoose');

const FixedExpenseSchema = new mongoose.Schema({
	nombre: { type: String, required: true },
	monto_mensual: { type: Number, required: true },
	activo: { type: Boolean, default: true }
});

module.exports = mongoose.model('FixedExpense', FixedExpenseSchema);

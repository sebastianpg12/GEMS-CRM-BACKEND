const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed, // Permite almacenar cualquier tipo de valor, incluyendo objetos
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware para actualizar updatedAt en cada modificación
SettingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Setting', SettingSchema);

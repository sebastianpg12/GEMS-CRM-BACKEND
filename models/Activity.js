const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: Date,
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'cancelled', 'overdue'], 
    default: 'pending' 
  },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Referencia a múltiples miembros del equipo
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  dueDate: { type: Date },
  estimatedTime: { type: String }, // Ej: "2 horas", "30 minutos"
  taskId: { type: String }, // ✅ ID de la tarea del board asociada (para sincronización)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Quien creó la actividad
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware para actualizar updatedAt en cada modificación
ActivitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Activity', ActivitySchema);

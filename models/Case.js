const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  // Información básica del caso
  titulo: { 
    type: String, 
    required: true 
  },
  descripcion: { 
    type: String, 
    required: true 
  },
  tipo: { 
    type: String, 
    required: true,
    enum: ['documento', 'incidencia', 'seguimiento']
  },
  
  // Estado y prioridad
  estado: { 
    type: String, 
    required: true,
    enum: ['abierto', 'en_progreso', 'resuelto', 'cerrado'],
    default: 'abierto'
  },
  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta', 'critica'],
    default: 'media'
  },
  
  // Relaciones
  cliente_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client',
    required: false 
  },
  asignado_a: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team',
    required: false 
  },
  
  // Archivos y documentos
  archivos: [{
    nombre: String,
    url: String,
    tipo: String, // pdf, docx, xlsx, img, etc.
    tamaño: Number,
    fecha_subida: { type: Date, default: Date.now }
  }],
  
  // Fechas importantes
  fecha_limite: {
    type: Date,
    required: false
  },
  fecha_resolucion: {
    type: Date,
    required: false
  },
  
  // Seguimiento y comentarios
  comentarios: [{
    autor: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Team' 
    },
    comentario: String,
    fecha: { type: Date, default: Date.now },
    tipo: {
      type: String,
      enum: ['comentario', 'actualizacion', 'resolucion'],
      default: 'comentario'
    }
  }],
  
  // Tags y categorización
  tags: [String],
  categoria: String,
  
  // Campos específicos para incidencias
  gravedad: {
    type: String,
    enum: ['menor', 'moderada', 'mayor', 'critica'],
    required: false
  },
  impacto: {
    type: String,
    enum: ['bajo', 'medio', 'alto'],
    required: false
  },
  
  // Campos específicos para seguimientos
  progreso: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  hitos: [{
    nombre: String,
    descripcion: String,
    fecha_objetivo: Date,
    fecha_completado: Date,
    completado: { type: Boolean, default: false }
  }],
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Middleware para actualizar updatedAt
CaseSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Índices para búsqueda optimizada
CaseSchema.index({ tipo: 1, estado: 1 });
CaseSchema.index({ cliente_id: 1 });
CaseSchema.index({ asignado_a: 1 });
CaseSchema.index({ 'tags': 1 });

module.exports = mongoose.model('Case', CaseSchema);

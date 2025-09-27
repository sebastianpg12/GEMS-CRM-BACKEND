const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'manager', 'employee', 'viewer'],
    default: 'employee'
  },
  avatar: {
    type: String,
    default: null
  },
  photo: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  position: {
    type: String,
    default: null
  },
  department: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  permissions: {
    dashboard: { type: Boolean, default: true },
    clients: { 
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    activities: { 
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    reports: { 
      view: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    accounting: { 
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    cases: { 
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    team: { 
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Set default permissions based on role
userSchema.pre('save', function(next) {
  if (!this.isModified('role')) return next();
  
  switch (this.role) {
    case 'admin':
      this.permissions = {
        dashboard: true,
        clients: { view: true, create: true, edit: true, delete: true },
        activities: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, export: true },
        accounting: { view: true, create: true, edit: true, delete: true },
        cases: { view: true, create: true, edit: true, delete: true },
        team: { view: true, create: true, edit: true, delete: true }
      };
      break;
    case 'manager':
      this.permissions = {
        dashboard: true,
        clients: { view: true, create: true, edit: true, delete: false },
        activities: { view: true, create: true, edit: true, delete: false },
        reports: { view: true, export: true },
        accounting: { view: true, create: true, edit: true, delete: false },
        cases: { view: true, create: true, edit: true, delete: false },
        team: { view: true, create: true, edit: true, delete: false }
      };
      break;
    case 'employee':
      this.permissions = {
        dashboard: true,
        clients: { view: false, create: false, edit: false, delete: false }, // Empleado NO puede ver clientes
        activities: { view: true, create: true, edit: true, delete: true }, // Empleado acceso completo a actividades
        reports: { view: false, export: false },
        accounting: { view: false, create: false, edit: false, delete: false },
        cases: { view: true, create: false, edit: false, delete: false }, // Empleado solo puede VER casos
        team: { view: true, create: false, edit: false, delete: false } // Empleado solo puede VER equipo
      };
      break;
    case 'viewer':
      this.permissions = {
        dashboard: true,
        clients: { view: true, create: false, edit: false, delete: false },
        activities: { view: true, create: false, edit: false, delete: false },
        reports: { view: false, export: false },
        accounting: { view: false, create: false, edit: false, delete: false },
        cases: { view: true, create: false, edit: false, delete: false },
        team: { view: false, create: false, edit: false, delete: false }
      };
      break;
  }
  next();
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  // Don't force default avatar here - let frontend handle defaults
  return user;
};

module.exports = mongoose.model('User', userSchema);

const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Cambiado de Team a User
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Middleware para verificar permisos de equipo
const checkTeamPermissions = (action) => {
  return (req, res, next) => {
    const user = req.user;
    console.log('🔐 Checking team permissions for:', user.email);
    console.log('👤 User role:', user.role);
    console.log('📋 User permissions:', JSON.stringify(user.permissions, null, 2));
    console.log('🎯 Required action:', action);
    
    // Por ahora, permitir a todos los usuarios autenticados ver el equipo para debugging
    if (action === 'view') {
      console.log('✅ Permitiendo vista de equipo (debug mode)');
      return next();
    }
    
    if (!user.permissions || !user.permissions.team || !user.permissions.team[action]) {
      console.log('❌ Permission denied for team action:', action);
      return res.status(403).json({ 
        success: false, 
        message: `No tienes permisos para realizar esta acción en la gestión de equipo: ${action}` 
      });
    }
    
    console.log('✅ Permission granted for team action:', action);
    next();
  };
};

// Obtener todos los miembros del equipo (usuarios)
router.get('/', checkTeamPermissions('view'), async (req, res) => {
  try {
    const team = await User.find({ isActive: true }).select('-password');
    res.json({ 
      success: true, 
      data: team.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        phone: user.phone,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener el equipo', 
      error: error.message 
    });
  }
});

// Crear nuevo miembro del equipo (usuario)
router.post('/', checkTeamPermissions('create'), async (req, res) => {
  try {
    const { name, email, password, role, department, position, phone } = req.body;
    
    // Verificar que el email no exista
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe un usuario con este email' 
      });
    }

    // Solo admin puede crear otros admins
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo los administradores pueden crear otros administradores' 
      });
    }

    // Asignar contraseña por defecto si no se proporciona
    const defaultPassword = password || 'gems12-';

    const member = new User({
      name,
      email,
      password: defaultPassword,
      role: role || 'employee',
      department,
      position,
      phone,
      isActive: true
    });
    
    await member.save();
    
    // Remover password de la respuesta
    const memberResponse = member.toJSON();
    
    res.status(201).json({ 
      success: true, 
      message: `Miembro del equipo creado exitosamente${!password ? ' con contraseña por defecto: gems12-' : ''}`,
      data: memberResponse
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Error al crear miembro del equipo', 
      error: error.message 
    });
  }
});

// Actualizar miembro del equipo
router.put('/:id', checkTeamPermissions('edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // No permitir cambiar la contraseña a través de esta ruta
    delete updateData.password;
    
    // Solo admin puede cambiar roles de admin
    if (updateData.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo los administradores pueden asignar el rol de administrador' 
      });
    }

    // No permitir que un usuario se modifique a sí mismo para evitar auto-bloqueo
    if (id === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes modificar tu propio usuario' 
      });
    }

    const member = await User.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Miembro del equipo no encontrado' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Miembro del equipo actualizado exitosamente',
      data: member
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Error al actualizar miembro del equipo', 
      error: error.message 
    });
  }
});

// Desactivar miembro del equipo (soft delete)
router.delete('/:id', checkTeamPermissions('delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // No permitir eliminar al propio usuario
    if (id === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes eliminar tu propio usuario' 
      });
    }

    const member = await User.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    ).select('-password');
    
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Miembro del equipo no encontrado' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Miembro del equipo desactivado exitosamente',
      data: member
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar miembro del equipo', 
      error: error.message 
    });
  }
});

// Reactivar miembro del equipo
router.put('/:id/activate', checkTeamPermissions('edit'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const member = await User.findByIdAndUpdate(
      id, 
      { isActive: true }, 
      { new: true }
    ).select('-password');
    
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'Miembro del equipo no encontrado' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Miembro del equipo reactivado exitosamente',
      data: member
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al reactivar miembro del equipo', 
      error: error.message 
    });
  }
});

module.exports = router;

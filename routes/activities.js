const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const User = require('../models/User');

// Obtener todas las actividades
router.get('/', async (req, res) => {
  try {
    const { assignedTo, status } = req.query;
    
    // Construir filtros
    let filter = {};
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    if (status) {
      filter.status = status;
    }

    const activities = await Activity.find(filter)
      .populate('clientId', 'name email company')
      .populate('assignedTo', 'name email role photo')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener actividades asignadas a un usuario específico
router.get('/assigned/:userId', async (req, res) => {
  try {
    const activities = await Activity.find({ assignedTo: req.params.userId })
      .populate('clientId', 'name email company')
      .populate('assignedTo', 'name email role photo')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear actividad
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating activity with data:', req.body);
    console.log('👤 AssignedTo field:', req.body.assignedTo);

    const activity = new Activity(req.body);
    await activity.save();

    console.log('✅ Activity saved with ID:', activity._id);
    console.log('👤 Saved assignedTo:', activity.assignedTo);

    // Poblar la actividad creada antes de enviarla
    const populatedActivity = await Activity.findById(activity._id)
      .populate('clientId', 'name email company')
      .populate('assignedTo', 'name email role photo')
      .populate('createdBy', 'name email');

    console.log('📋 Populated activity:', populatedActivity);

    // --- Enviar notificación a WhatsApp (avisos) ---
    try {
      // Configura el groupId de la sección 'avisos' de tu comunidad
      const groupId = process.env.WPP_AVISOS_GROUP_ID || '<AQUÍ_EL_ID_DEL_GRUPO>'; // Reemplaza por el ID real
      // Mensaje personalizado
      const msg = `📝 Nueva tarea creada:\nTítulo: ${populatedActivity.title}\nEncargado: ${populatedActivity.assignedTo?.name || 'Sin asignar'}\nCliente: ${populatedActivity.clientId?.name || ''}\nVencimiento: ${populatedActivity.dueDate ? new Date(populatedActivity.dueDate).toLocaleDateString() : 'Sin fecha'}\nDescripción: ${populatedActivity.description || ''}`;
      // Llamada al endpoint centralizado
      await fetch('https://gems-crm-backend.onrender.com/api/wpp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, message: msg })
      });
      console.log('✅ Notificación enviada a WhatsApp avisos');
    } catch (wppErr) {
      console.error('❌ Error enviando notificación WhatsApp:', wppErr);
    }

    res.json(populatedActivity);
  } catch (error) {
    console.error('❌ Error creating activity:', error);
    res.status(400).json({ error: error.message });
  }
});

// Actualizar actividad
router.put('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: new Date() }, 
      { new: true }
    )
      .populate('clientId', 'name email company')
      .populate('assignedTo', 'name email role photo')
      .populate('createdBy', 'name email');
    
    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cambiar estado de actividad
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    )
      .populate('clientId', 'name email company')
      .populate('assignedTo', 'name email role photo')
      .populate('createdBy', 'name email');
    
    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reasignar actividad
router.patch('/:id/assign', async (req, res) => {
  try {
    const { assignedTo } = req.body;
    
    // Verificar que el usuario existe
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
    }
    
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      { assignedTo, updatedAt: new Date() },
      { new: true }
    )
      .populate('clientId', 'name email company')
      .populate('assignedTo', 'name email role photo')
      .populate('createdBy', 'name email');
    
    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar actividad
router.delete('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

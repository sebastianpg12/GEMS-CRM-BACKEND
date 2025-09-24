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
  .populate('assignedTo', 'name email role photo phone')
  .populate('createdBy', 'name email');

    console.log('📋 Populated activity:', populatedActivity);

    // --- Enviar notificación a WhatsApp (grupo notificaciones) usando Baileys ---
    try {
      // Acceso al cliente Baileys y búsqueda de grupo 'notificaciones'
      const baileysSock = req.app.get('baileysSock') || global.baileysSock;
      const baileysReady = req.app.get('baileysReady') || global.baileysReady;
      if (baileysSock && baileysReady) {
        const allGroups = await baileysSock.groupFetchAllParticipating();
        let groupId = null;
        for (const id in allGroups) {
          const group = allGroups[id];
          if (group.subject && group.subject.toLowerCase().includes('notificaciones')) {
            groupId = group.id;
            break;
          }
        }
        if (groupId) {
          // Mejorar la lógica de mención: validar, formatear y buscar el JID en los participantes del grupo
          let encargadoMention = '';
          let mentionedJids = [];
          let mentionReason = '';
          if (populatedActivity.assignedTo && populatedActivity.assignedTo.phone) {
            let phoneRaw = populatedActivity.assignedTo.phone.replace(/[^\d]/g, '');
            if (phoneRaw.startsWith('0')) phoneRaw = phoneRaw.substring(1);
            if (phoneRaw.length >= 10) {
              const jid = `${phoneRaw}@s.whatsapp.net`;
              const group = allGroups[groupId];
              // Log completo del objeto de participantes para inspección
              console.log('[WhatsApp Mention] group.participants:', JSON.stringify(group?.participants, null, 2));
              // group.participants es un array, extraer los JID reales
              const participants = group?.participants ? group.participants.map(p => p.jid) : [];
              // Mostrar mapping de JID a nombre para depuración
              const participantInfo = group?.participants ? group.participants.map(p => `${p.jid} (admin: ${p.admin || 'no'})`) : [];
              console.log(`[WhatsApp Mention] JID generado: ${jid}`);
              console.log(`[WhatsApp Mention] Participantes del grupo:`, participantInfo);
              if (participants.includes(jid)) {
                encargadoMention = `@${phoneRaw}`;
                mentionedJids = [jid];
                mentionReason = 'Mención realizada correctamente.';
              }
              // Log para comparar el JID que intentamos mencionar y los integrantes del grupo
              console.log('[WhatsApp Mention] Intentando mencionar:', jid);
              console.log('[WhatsApp Mention] Integrantes del grupo:');
              participantInfo.forEach(p => console.log('  -', p));
              if (!participants.includes(jid)) {
                mentionReason = `No se realizó la mención: el JID (${jid}) no está entre los participantes del grupo.`;
              }
            } else {
              mentionReason = `No se realizó la mención: el número (${phoneRaw}) tiene menos de 10 dígitos.`;
            }
          } else {
            mentionReason = 'No se realizó la mención: no hay teléfono asignado al encargado.';
          }
          const msg =
            `📝 *Nueva tarea creada*\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `*Tarea:* ${populatedActivity.title}\n` +
            `*Encargado:* ${populatedActivity.assignedTo?.name || 'Sin asignar'} ${encargadoMention}\n` +
            (populatedActivity.clientId?.name ? `*Cliente:* ${populatedActivity.clientId.name}\n` : '') +
            `*Vencimiento:* ${populatedActivity.dueDate ? new Date(populatedActivity.dueDate).toLocaleDateString() : 'Sin fecha'}\n` +
            (populatedActivity.description ? `*Descripción:* ${populatedActivity.description}\n` : '') +
            `━━━━━━━━━━━━━━━━━━━`;
          await baileysSock.sendMessage(groupId, { text: msg, mentions: mentionedJids });
          console.log('✅ Notificación enviada al grupo de notificaciones GEMS (Baileys)');
          console.log(`[WhatsApp Mention] Motivo: ${mentionReason}`);
        } else {
          console.warn('No se encontró el grupo "notificaciones" para enviar el mensaje (Baileys).');
        }
      } else {
        console.warn('WhatsApp (Baileys) no está listo para enviar notificaciones.');
      }
    } catch (wppErr) {
      console.error('❌ Error enviando notificación WhatsApp (Baileys):', wppErr);
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

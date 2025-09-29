const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const User = require('../models/User');

// Crear nueva actividad
router.post('/', async (req, res) => {
  console.log('🚀 [ACTIVITIES] Iniciando creación de nueva actividad');
  console.log('📝 [ACTIVITIES] Datos recibidos:', JSON.stringify(req.body, null, 2));

  try {
    const activity = new Activity(req.body);
    await activity.save();

    console.log('✅ [ACTIVITIES] Activity saved with ID:', activity._id);
    console.log('👤 [ACTIVITIES] Saved assignedTo:', activity.assignedTo);

    // Poblar la actividad creada antes de enviarla
    const populatedActivity = await Activity.findById(activity._id)
      .populate('clientId', 'name email company')
      .populate('assignedTo', 'name email role photo phone avatar')
      .populate('createdBy', 'name email');

    console.log('📋 [ACTIVITIES] Populated activity:', {
      id: populatedActivity._id,
      title: populatedActivity.title,
      assignedTo: populatedActivity.assignedTo?.map(u => ({ name: u.name, phone: u.phone })) || []
    });

    // --- Enviar notificación a WhatsApp (grupo notificaciones) usando Baileys ---
    console.log('📱 [WHATSAPP] Iniciando envío de notificación WhatsApp...');

    try {
      const baileysSock = req.app.get('baileysSock') || global.baileysSock;
      const baileysReady = req.app.get('baileysReady') || global.baileysReady;

      console.log('🔌 [WHATSAPP] Baileys sock disponible:', !!baileysSock);
      console.log('✅ [WHATSAPP] Baileys ready:', baileysReady);

      if (baileysSock && baileysReady) {
        console.log('🔍 [WHATSAPP] Buscando grupo de notificaciones...');
        const allGroups = await baileysSock.groupFetchAllParticipating();
        console.log('📋 [WHATSAPP] Grupos encontrados:', Object.keys(allGroups).length);

        let groupId = null;
        for (const id in allGroups) {
          const group = allGroups[id];
          console.log('👥 [WHATSAPP] Revisando grupo:', group.subject);
          if (group.subject && group.subject.toLowerCase().includes('notificaciones')) {
            groupId = group.id;
            console.log('🎯 [WHATSAPP] Grupo de notificaciones encontrado:', groupId);
            break;
          }
        }

        if (groupId) {
          console.log('📝 [WHATSAPP] Preparando mensaje para grupo:', groupId);

          // Mencionar a todos los asignados
          let encargadoMention = '';
          let mentionedJids = [];
          let mentionReason = '';

          if (Array.isArray(populatedActivity.assignedTo)) {
            console.log('👥 [WHATSAPP] Procesando usuarios asignados:', populatedActivity.assignedTo.length);
            populatedActivity.assignedTo.forEach(user => {
              console.log('👤 [WHATSAPP] Procesando usuario:', user.name, 'Phone:', user.phone);
              if (user && user.phone) {
                let phoneRaw = user.phone.replace(/[^\d]/g, '');
                if (phoneRaw.startsWith('0')) phoneRaw = phoneRaw.substring(1);
                if (phoneRaw.length >= 10) {
                  const jid = `${phoneRaw}@s.whatsapp.net`;
                  console.log('📞 [WHATSAPP] JID generado:', jid);

                  const group = allGroups[groupId];
                  const participants = group?.participants ? group.participants.map(p => p.jid) : [];
                  console.log('👥 [WHATSAPP] Participantes del grupo:', participants.length);

                  if (participants.includes(jid)) {
                    encargadoMention += `@${phoneRaw} `;
                    mentionedJids.push(jid);
                    console.log('✅ [WHATSAPP] Usuario agregado a menciones:', user.name);
                  } else {
                    console.log('❌ [WHATSAPP] Usuario no está en el grupo:', user.name);
                  }
                } else {
                  console.log('❌ [WHATSAPP] Teléfono inválido:', user.phone);
                }
              } else {
                console.log('❌ [WHATSAPP] Usuario sin teléfono:', user?.name);
              }
            });

            mentionReason = mentionedJids.length > 0 ? 'Mención realizada correctamente.' : 'No se realizó la mención: ningún JID válido.';
          } else {
            mentionReason = 'No se realizó la mención: no hay usuarios asignados.';
            console.log('❌ [WHATSAPP] No hay usuarios asignados');
          }

          const msg =
            `*\ud83d\udcdd NUEVA TAREA CREADA*\\n\\n` +
            `\ud83c\udfaf *TAREA:* ${populatedActivity.title}\\n\\n` +
            `\ud83d\udc64 *ENCARGADOS:* ${populatedActivity.assignedTo?.map(u => u.name).join(', ') || 'Sin asignar'} ${encargadoMention}\\n\\n` +
            (populatedActivity.clientId?.name ? `\ud83c\udfe2 *CLIENTE:* ${populatedActivity.clientId.name}\\n\\n` : '') +
            `\ud83d\udcc5 *VENCIMIENTO:* ${populatedActivity.dueDate ? new Date(populatedActivity.dueDate).toLocaleDateString() : 'Sin fecha'}\\n\\n` +
            (populatedActivity.description ? `\ud83d\udcdd *DESCRIPCIÓN:*\\n${populatedActivity.description}\\n` : '');

          console.log('📤 [WHATSAPP] Enviando mensaje...');
          console.log('💬 [WHATSAPP] Mensaje:', msg);
          console.log('🏷️ [WHATSAPP] Menciones:', mentionedJids);

          await baileysSock.sendMessage(groupId, { text: msg, mentions: mentionedJids });
          console.log('✅ [WHATSAPP] Notificación enviada al grupo de notificaciones GEMS (Baileys)');
          console.log(`[WhatsApp Mention] Motivo: ${mentionReason}`);
        } else {
          console.warn('❌ [WHATSAPP] No se encontró el grupo "notificaciones" para enviar el mensaje (Baileys).');
          console.log('📋 [WHATSAPP] Grupos disponibles:', Object.values(allGroups).map(g => g.subject));
        }
      } else {
        console.warn('❌ [WHATSAPP] WhatsApp (Baileys) no está listo para enviar notificaciones.');
        console.log('🔌 [WHATSAPP] Sock:', !!baileysSock, 'Ready:', baileysReady);
      }
    } catch (wppErr) {
      console.error('❌ [WHATSAPP] Error enviando notificación WhatsApp (Baileys):', wppErr);
    }

    console.log('✅ [ACTIVITIES] Actividad creada exitosamente');
    res.json(populatedActivity);
  } catch (error) {
    console.error('❌ [ACTIVITIES] Error creating activity:', error);
    res.status(400).json({ error: error.message });
  }
});

// Obtener actividades pendientes asignadas al usuario logueado
router.get('/mine', async (req, res) => {
  try {
    // El ID del usuario logueado debe estar en req.user._id (middleware de autenticación)
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    const activities = await Activity.find({ assignedTo: { $in: [userId] }, status: 'pending' })
      .populate('clientId', 'name email company')
      .populate('assignedTo', 'name email role photo avatar')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las actividades
router.get('/', async (req, res) => {
  try {
    const { assignedTo, status } = req.query;
    
    // Construir filtros
    let filter = {};
    if (assignedTo) {
      filter.assignedTo = { $in: [assignedTo] };
    }
    if (status) {
      filter.status = status;
    }

    const activities = await Activity.find(filter)
      .populate('clientId', 'name email company')
      .populate('assignedTo', 'name email role photo avatar')
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
    console.log('[API] Buscando actividades para assignedTo:', req.params.userId);
    const activities = await Activity.find({ assignedTo: { $in: [req.params.userId] } })
      .populate('clientId', 'name email company')
      .populate('assignedTo', 'name email role photo avatar')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });
    console.log('[API] Actividades encontradas:', activities.length);
    res.json(activities);
  } catch (error) {
    console.error('❌ Error obteniendo actividades asignadas:', error);
    res.status(500).json({ error: error.message });
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
      .populate('assignedTo', 'name email role photo avatar')
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
      .populate('assignedTo', 'name email role photo avatar')
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
      .populate('assignedTo', 'name email role photo avatar')
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

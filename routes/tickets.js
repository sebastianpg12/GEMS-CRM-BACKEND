const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Helper for WhatsApp Priority Text
const getPriorityText = (priority) => {
  const priorities = {
    'low': '🟢 Baja',
    'medium': '🟡 Media',
    'high': '🟠 Alta',
    'urgent': '🔴 Urgente'
  };
  return priorities[priority] || '🟡 Media';
};

// --- PUBLIC ROUTES (No Auth) ---

// Create ticket from public form
router.post('/public', async (req, res) => {
  try {
    const { subject, description, category, priority, name, email, clientId } = req.body;

    // 1. Create the Ticket
    const ticket = new Ticket({
      subject,
      description,
      category,
      priority,
      submittedBy: { name, email, clientId }
    });

    // 2. Auto-assignment Logic
    const supportAgents = await User.find({ role: 'support', isActive: true });
    
    if (supportAgents.length > 0) {
      // Find agent with fewest active tickets
      const agentLoads = await Promise.all(supportAgents.map(async (agent) => {
        const count = await Ticket.countDocuments({ 
          assignedTo: agent._id, 
          status: { $in: ['new', 'open', 'waiting'] } 
        });
        return { agent, count };
      }));

      // Sort by load
      agentLoads.sort((a, b) => a.count - b.count);
      const chosenAgent = agentLoads[0].agent;
      
      ticket.assignedTo = chosenAgent._id;
      ticket.status = 'open'; // Change from new to open since it's assigned
    }

    await ticket.save();

    // 3. WhatsApp Notification
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('assignedTo', 'name email phone');

    try {
      const baileysSock = req.app.get('baileysSock');
      const baileysReady = req.app.get('baileysReady');

      if (baileysSock && baileysReady) {
        const allGroups = await baileysSock.groupFetchAllParticipating();
        let groupId = null;
        for (const id in allGroups) {
          if (allGroups[id].subject?.toLowerCase().includes('notificaciones')) {
            groupId = id;
            break;
          }
        }

        if (groupId) {
          let msg = `*🎫 NUEVO TICKET RECIBIDO*\n\n`;
          msg += `*Número:* ${populatedTicket.ticketNumber}\n`;
          msg += `*Asunto:* ${populatedTicket.subject}\n`;
          msg += `*Cliente:* ${populatedTicket.submittedBy.name} (${populatedTicket.submittedBy.email})\n`;
          msg += `*Categoría:* ${populatedTicket.category}\n`;
          msg += `*Prioridad:* ${getPriorityText(populatedTicket.priority)}\n\n`;
          
          if (populatedTicket.assignedTo) {
            msg += `👤 *Asignado a:* ${populatedTicket.assignedTo.name}`;
          } else {
            msg += `⚠️ *Estado:* Sin asignar (No hay agentes de soporte disponibles)`;
          }

          let mentions = [];
          if (populatedTicket.assignedTo?.phone) {
            const jid = `${populatedTicket.assignedTo.phone.replace(/\D/g, '')}@s.whatsapp.net`;
            mentions.push(jid);
          }

          await baileysSock.sendMessage(groupId, { text: msg, mentions });
        }
      }
    } catch (wppErr) {
      console.error('Error sending Ticket WhatsApp notification:', wppErr);
    }

    res.status(201).json({
      success: true,
      data: populatedTicket,
      message: 'Ticket creado exitosamente'
    });
  } catch (error) {
    console.error('Error creating public ticket:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// --- AUTHENTICATED ROUTES ---

// Get all tickets (Admin/Manager/Support)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // Support role might only see assigned or new? 
    // For now, let's allow support to see all to have context of unassigned ones.
    
    const tickets = await Ticket.find(query)
      .populate('assignedTo', 'name email avatar photo')
      .populate('submittedBy.userId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get my assigned tickets
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const tickets = await Ticket.find({ assignedTo: userId })
      .populate('submittedBy.userId', 'name email avatar')
      .sort({ updatedAt: -1 });
    
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get ticket detail
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('comments.author', 'name email avatar role');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status, updatedAt: new Date() };
    
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedTo', 'name email avatar');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Add comment
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { text, isInternal } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    ticket.comments.push({
      text,
      author: req.user._id,
      isInternal: isInternal || false
    });

    await ticket.save();
    
    const populatedTicket = await Ticket.findById(req.params.id)
      .populate('comments.author', 'name email avatar role');

    res.json({ success: true, data: populatedTicket.comments[populatedTicket.comments.length - 1] });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;

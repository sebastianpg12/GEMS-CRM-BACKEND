const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { notifyTicketCreated, notifyStatusChanged } = require('../services/emailService');

// Configure multer for ticket attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/tickets/';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, 'ticket-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});


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

// Create ticket from public form (with attachments)
router.post('/public', upload.array('files', 5), async (req, res) => {
  try {
    console.log('[Tickets] POST /public hit. Body:', req.body);
    const { subject, description, category, priority, name, email, clientId, userId } = req.body;
    
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => `/uploads/tickets/${file.filename}`);
    }

    // 1. Create the Ticket
    const ticket = new Ticket({
      subject,
      description,
      category,
      priority,
      attachments,
      submittedBy: { name, email, clientId, userId }
    });


    // 2. Auto-assignment Logic
    const supportAgents = await User.find({ role: 'support', isActive: true });
    let assignedAgent = null;
    
    if (supportAgents.length > 0) {
      // Find agent with fewest active tickets
      const agentLoads = await Promise.all(supportAgents.map(async (agent) => {
        const count = await Ticket.countDocuments({ 
          assignedTo: agent._id, 
          status: { $in: ['new', 'open', 'waiting'] } 
        });
        return { agent, count };
      }));

      agentLoads.sort((a, b) => a.count - b.count);
      assignedAgent = agentLoads[0].agent;
      
      ticket.assignedTo = assignedAgent._id;
      ticket.status = 'open'; 
    }

    await ticket.save();

    // ── Email notifications (non-blocking) ──
    notifyTicketCreated(ticket, assignedAgent).catch(e => console.error('[Email] Error notifyTicketCreated:', e.message));

    // 3. WhatsApp Notification
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
          msg += `*Número:* ${ticket.ticketNumber}\n`;
          msg += `*Asunto:* ${ticket.subject}\n`;
          msg += `*Cliente:* ${ticket.submittedBy.name} (${ticket.submittedBy.email})\n`;
          msg += `*Prioridad:* ${getPriorityText(ticket.priority)}\n\n`;
          
          if (assignedAgent) {
            msg += `👤 *Asignado a:* ${assignedAgent.name}`;
          } else {
            msg += `⚠️ *Estado:* Sin asignar`;
          }

          let mentions = [];
          if (assignedAgent?.phone) {
            const jid = `${assignedAgent.phone.replace(/\D/g, '')}@s.whatsapp.net`;
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
      data: ticket,
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

// Get my assigned tickets (Agent view)
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

// Get my ticket history (Client view)
router.get('/client-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const email = req.user.email;
    
    // Find tickets submitted by this user (either by ID if associated or by email)
    const tickets = await Ticket.find({
      $or: [
        { 'submittedBy.userId': userId },
        { 'submittedBy.email': email }
      ]
    })
    .populate('assignedTo', 'name email avatar position')
    .sort({ createdAt: -1 });

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
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    const oldStatus = ticket.status;
    const updateData = { status, updatedAt: new Date() };
    
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedTo', 'name email avatar');

    if (status !== oldStatus) {
      notifyStatusChanged(updatedTicket, oldStatus, status).catch(e => console.error('[Email] Error notifyStatusChanged:', e.message));
    }

    res.json({ success: true, data: updatedTicket });
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

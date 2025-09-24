const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
// CORS sencillo: refleja el origin del request (permite todos los orígenes) y soporta credenciales
const corsOptions = {
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};


const app = express();
const server = http.createServer(app);

// Apply CORS before JSON/static so uploads also get proper headers
app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO CORS: permitir cualquier origen (útil para desarrollo y apps SPA)
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

let avisosGroupId = null; // Guardar el ID del grupo 'avisos' automáticamente

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads/chat directory if it doesn't exist
const fs = require('fs');

const chatUploadsDir = path.join(__dirname, 'uploads', 'chat');
if (!fs.existsSync(chatUploadsDir)) {
  fs.mkdirSync(chatUploadsDir, { recursive: true });
}

// Store io instance in app for use in routes
app.set('io', io);

// Importar rutas
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const activitiesRoutes = require('./routes/activities');
const paymentsRoutes = require('./routes/payments');
const accountingRoutes = require('./routes/accounting');
const casesRoutes = require('./routes/cases');
const followupsRoutes = require('./routes/followups');
const issuesRoutes = require('./routes/issues');
const notificationsRoutes = require('./routes/notifications');
const docsRoutes = require('./routes/docs');

const minutesRoutes = require('./routes/minutes');
const settingsRoutes = require('./routes/settings');
const teamRoutes = require('./routes/team');
const reportsRoutes = require('./routes/reports');

const chatRoutes = require('./routes/chat');
const prospectsRoutes = require('./routes/prospects');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/followups', followupsRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/minutes', minutesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/prospects', prospectsRoutes);

// Conexión a MongoDB usando .env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  // Presence tracking maps
  // userId -> connection count
  if (!io.onlineUsers) {
    io.onlineUsers = new Map();
  }
  // socket.id -> userId
  if (!io.socketToUser) {
    io.socketToUser = new Map();
  }
  
  // Join user to their personal room
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  // Map this socket to user
  io.socketToUser.set(socket.id, userId);
  const current = io.onlineUsers.get(userId) || 0;
  io.onlineUsers.set(userId, current + 1);
  // Broadcast presence update to all clients
  const onlineList = Array.from(io.onlineUsers.keys());
  io.emit('presence_update', onlineList);
  });
  
  // Join chat room
  socket.on('join_room', (roomId) => {
    socket.join(`room_${roomId}`);
    console.log(`User joined room: ${roomId}`);
  });
  
  // Leave chat room
  socket.on('leave_room', (roomId) => {
    socket.leave(`room_${roomId}`);
    console.log(`User left room: ${roomId}`);
  });
  
  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`room_${data.roomId}`).emit('user_typing', {
      userId: data.userId,
      userName: data.userName,
      roomId: data.roomId
    });
  });
  
  socket.on('typing_stop', (data) => {
    socket.to(`room_${data.roomId}`).emit('user_stop_typing', {
      userId: data.userId,
      roomId: data.roomId
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Update presence maps
    const userId = io.socketToUser.get(socket.id);
    if (userId) {
      const current = io.onlineUsers.get(userId) || 0;
      if (current <= 1) {
        io.onlineUsers.delete(userId);
      } else {
        io.onlineUsers.set(userId, current - 1);
      }
      io.socketToUser.delete(socket.id);
      // Broadcast updated presence
      const onlineList = Array.from(io.onlineUsers.keys());
      io.emit('presence_update', onlineList);
    }
  });
});

// --- INTEGRACIÓN WHATSAPP WEB ---
const { Client, LocalAuth } = require('whatsapp-web.js');
const WppStatus = require('./models/WppStatus');
let qrCode = null;
let wppReady = false;
let wppClient = null;
const WppSession = require('./models/WppSession');
let wppSessionData = null;

// --- FUNCIONES PARA SESIÓN WHATSAPP EN MONGODB ---
async function loadSessionFromDb() {
  const sessionDoc = await WppSession.findOne({});
  if (sessionDoc && sessionDoc.session && Object.keys(sessionDoc.session).length > 0) {
    wppSessionData = sessionDoc.session;
    console.log('Sesión WhatsApp restaurada desde MongoDB');
  } else {
    wppSessionData = null;
    console.log('No hay sesión WhatsApp en MongoDB, se requiere escanear QR');
  }
}

function saveSessionToDb(session) {
  WppSession.findOneAndUpdate({}, { session, updatedAt: new Date() }, { upsert: true }).exec();
}

async function initWppClient() {
  await loadSessionFromDb();
  wppClient = new Client({
    session: wppSessionData,
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  });

  wppClient.on('qr', (qr) => {
    qrCode = qr;
    wppReady = false;
    console.log('QR actualizado para vincular WhatsApp Business');
    WppStatus.findOneAndUpdate({}, { ready: false, updatedAt: new Date() }, { upsert: true }).exec();
  });

  wppClient.on('ready', () => {
    wppReady = true;
    app.set('wppClient', wppClient);
    app.set('wppReady', true);
    console.log('WhatsApp vinculado y listo para enviar mensajes');
    WppStatus.findOneAndUpdate({}, { ready: true, updatedAt: new Date() }, { upsert: true }).exec();
    // Buscar el grupo 'notificaciones' y enviar mensaje
    (async () => {
      try {
        const chats = await wppClient.getChats();
        const group = chats.find(chat => chat.isGroup && chat.name && chat.name.toLowerCase().includes('notificaciones'));
        if (group) {
          await wppClient.sendMessage(group.id._serialized, '✅ WhatsApp vinculado correctamente a la comunidad GEMS.');
          console.log('Mensaje enviado al grupo de notificaciones GEMS');
        } else {
          console.warn('No se encontró el grupo "notificaciones" para enviar el mensaje.');
        }
      } catch (err) {
        console.error('Error al enviar mensaje de vinculación:', err.message);
      }
    })();
  });

  wppClient.on('auth_failure', (msg) => {
  wppReady = false;
  app.set('wppReady', false);
  console.error('Error de autenticación WhatsApp:', msg);
  WppStatus.findOneAndUpdate({}, { ready: false, updatedAt: new Date() }, { upsert: true }).exec();
  });

  wppClient.on('disconnected', (reason) => {
  wppReady = false;
  app.set('wppReady', false);
  console.warn('WhatsApp Web desconectado:', reason);
  WppStatus.findOneAndUpdate({}, { ready: false, updatedAt: new Date() }, { upsert: true }).exec();
  });

  wppClient.on('authenticated', (session) => {
    saveSessionToDb(session);
    console.log('Sesión WhatsApp guardada en MongoDB');
  });

  wppClient.initialize();
}

// Inicializar WhatsApp Web Client con sesión en MongoDB
initWppClient();
app.post('/api/wpp-send', async (req, res) => {
  if (!wppReady) return res.status(503).json({ error: 'WhatsApp no vinculado' });
  const { message } = req.body;
  if (!avisosGroupId) return res.status(404).json({ error: 'No se encontró el grupo "avisos" vinculado' });
  try {
    await wppClient.sendMessage(avisosGroupId, message);
    res.json({ sent: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para listar grupos/chats de WhatsApp (solo para uso interno)
app.get('/api/wpp-groups', async (req, res) => {
  if (!wppReady) return res.status(503).json({ error: 'WhatsApp no vinculado' });
  try {
    const chats = await wppClient.getChats();
    // Filtrar solo grupos
    const groups = chats.filter(chat => chat.isGroup);
    // Mapear nombre e ID
    const result = groups.map(g => ({ name: g.name, id: g.id._serialized }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para consultar el estado de la sesión de WhatsApp
app.get('/api/wpp-status', async (req, res) => {
  try {
    const status = await WppStatus.findOne({});
    res.json({ ready: !!(status && status.ready) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener el QR de WhatsApp
app.get('/api/wpp-qr', (req, res) => {
  if (qrCode && !wppReady) {
    res.json({ qr: qrCode });
  } else if (wppReady) {
    res.json({ status: 'ready' });
  } else {
    res.status(503).json({ error: 'QR no disponible aún' });
  }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on porta ${PORT}`);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

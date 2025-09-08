const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Obtener todas las notificaciones
router.get('/', async (req, res) => {
  const notifications = await Notification.find().populate('clientId');
  res.json(notifications);
});

// Crear notificación
router.post('/', async (req, res) => {
  const notification = new Notification(req.body);
  await notification.save();
  res.json(notification);
});

// Actualizar notificación
router.put('/:id', async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(notification);
});

// Eliminar notificación
router.delete('/:id', async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

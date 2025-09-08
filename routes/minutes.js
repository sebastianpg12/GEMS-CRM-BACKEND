const express = require('express');
const router = express.Router();
const Minute = require('../models/Minute');

// Obtener todas las minutas
router.get('/', async (req, res) => {
  const minutes = await Minute.find().populate('clientId');
  res.json(minutes);
});

// Crear minuta
router.post('/', async (req, res) => {
  const minute = new Minute(req.body);
  await minute.save();
  res.json(minute);
});

// Actualizar minuta
router.put('/:id', async (req, res) => {
  const minute = await Minute.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(minute);
});

// Eliminar minuta
router.delete('/:id', async (req, res) => {
  await Minute.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

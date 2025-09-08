const express = require('express');
const router = express.Router();
const Followup = require('../models/Followup');

// Obtener todos los seguimientos
router.get('/', async (req, res) => {
  const followups = await Followup.find().populate('clientId');
  res.json(followups);
});

// Crear seguimiento
router.post('/', async (req, res) => {
  const followup = new Followup(req.body);
  await followup.save();
  res.json(followup);
});

// Actualizar seguimiento
router.put('/:id', async (req, res) => {
  const followup = await Followup.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(followup);
});

// Eliminar seguimiento
router.delete('/:id', async (req, res) => {
  await Followup.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

// Obtener todas las configuraciones
router.get('/', async (req, res) => {
  const settings = await Setting.find();
  res.json(settings);
});

// Crear configuración
router.post('/', async (req, res) => {
  const setting = new Setting(req.body);
  await setting.save();
  res.json(setting);
});

// Actualizar configuración
router.put('/:id', async (req, res) => {
  const setting = await Setting.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(setting);
});

// Eliminar configuración
router.delete('/:id', async (req, res) => {
  await Setting.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Doc = require('../models/Doc');

// Obtener todos los documentos
router.get('/', async (req, res) => {
  const docs = await Doc.find().populate('clientId');
  res.json(docs);
});

// Crear documento
router.post('/', async (req, res) => {
  const doc = new Doc(req.body);
  await doc.save();
  res.json(doc);
});

// Actualizar documento
router.put('/:id', async (req, res) => {
  const doc = await Doc.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(doc);
});

// Eliminar documento
router.delete('/:id', async (req, res) => {
  await Doc.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

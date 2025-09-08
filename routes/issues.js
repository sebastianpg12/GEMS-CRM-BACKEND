const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');

// Obtener todos los issues
router.get('/', async (req, res) => {
  const issues = await Issue.find().populate('clientId');
  res.json(issues);
});

// Crear issue
router.post('/', async (req, res) => {
  const issue = new Issue(req.body);
  await issue.save();
  res.json(issue);
});

// Actualizar issue
router.put('/:id', async (req, res) => {
  const issue = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(issue);
});

// Eliminar issue
router.delete('/:id', async (req, res) => {
  await Issue.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

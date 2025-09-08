const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// Obtener todos los clientes
router.get('/', async (req, res) => {
  const clients = await Client.find();
  res.json(clients);
});

// Crear cliente
router.post('/', async (req, res) => {
  const client = new Client(req.body);
  await client.save();
  res.json(client);
});
// Crear cliente
router.post('/', async (req, res) => {
  const data = { ...req.body };
  // Adaptar campos para compatibilidad con Postman
  if (data.nombre) data.name = data.nombre;
  if (data.telefono) data.phone = data.telefono;
  const client = new Client(data);
  await client.save();
  res.json(client);
});

// Actualizar cliente
router.put('/:id', async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(client);
});
// Actualizar cliente
router.put('/:id', async (req, res) => {
  const data = { ...req.body };
  if (data.nombre) data.name = data.nombre;
  if (data.telefono) data.phone = data.telefono;
  const client = await Client.findByIdAndUpdate(req.params.id, data, { new: true });
  res.json(client);
});

// Eliminar cliente
router.delete('/:id', async (req, res) => {
  await Client.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

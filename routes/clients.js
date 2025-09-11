const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// Obtener todos los clientes
router.get('/', async (req, res) => {
  const clients = await Client.find().sort({ createdAt: -1 });
  res.json(clients);
});

// Obtener cliente por ID (legacy support)
router.get('/:id', async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json(client);
});

// Crear cliente
router.post('/', async (req, res) => {
  const data = { ...req.body };
  // Compat: map alternative keys
  if (data.nombre) data.name = data.nombre;
  if (data.telefono) data.phone = data.telefono;
  const client = new Client(data);
  await client.save();
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

// Detail (wiki) endpoints
router.get('/:id/detail', async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json(client);
});

router.patch('/:id/detail', async (req, res) => {
  const updates = req.body || {};
  const client = await Client.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true }
  );
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json(client);
});

// Notes CRUD
router.post('/:id/notes', async (req, res) => {
  const { content, author, pinned } = req.body;
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  client.notes.push({ content, author, pinned });
  await client.save();
  res.json(client.notes[client.notes.length - 1]);
});

router.put('/:id/notes/:noteId', async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  const note = client.notes.id(req.params.noteId);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  Object.assign(note, req.body);
  await client.save();
  res.json(note);
});

router.delete('/:id/notes/:noteId', async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  const note = client.notes.id(req.params.noteId);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  note.deleteOne();
  await client.save();
  res.json({ success: true });
});

// Services CRUD
router.post('/:id/services', async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  client.services.push(req.body);
  await client.save();
  res.json(client.services[client.services.length - 1]);
});

router.put('/:id/services/:serviceId', async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  const service = client.services.id(req.params.serviceId);
  if (!service) return res.status(404).json({ message: 'Service not found' });
  Object.assign(service, req.body);
  await client.save();
  res.json(service);
});

router.delete('/:id/services/:serviceId', async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  const service = client.services.id(req.params.serviceId);
  if (!service) return res.status(404).json({ message: 'Service not found' });
  service.deleteOne();
  await client.save();
  res.json({ success: true });
});

// Commitments CRUD
router.post('/:id/commitments', async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  client.commitments.push(req.body);
  await client.save();
  res.json(client.commitments[client.commitments.length - 1]);
});

router.put('/:id/commitments/:commitmentId', async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  const item = client.commitments.id(req.params.commitmentId);
  if (!item) return res.status(404).json({ message: 'Commitment not found' });
  Object.assign(item, req.body);
  await client.save();
  res.json(item);
});

router.delete('/:id/commitments/:commitmentId', async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  const item = client.commitments.id(req.params.commitmentId);
  if (!item) return res.status(404).json({ message: 'Commitment not found' });
  item.deleteOne();
  await client.save();
  res.json({ success: true });
});

module.exports = router;

module.exports = router;

const express = require('express')
const router = express.Router()
const ProspectConversation = require('../models/ProspectConversation')

// Crear nueva conversación
router.post('/', async (req, res) => {
  try {
    const { prospectName, company, createdBy, initialMessage } = req.body
    const conversation = new ProspectConversation({
      prospectName,
      company,
      createdBy: createdBy || null,
      messages: initialMessage ? [{ role: 'user', content: initialMessage }] : []
    })
    await conversation.save()
    res.status(201).json(conversation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Obtener todas las conversaciones
router.get('/', async (req, res) => {
  try {
    const conversations = await ProspectConversation.find().populate('createdBy', 'name email')
    res.json(conversations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Obtener una conversación específica
router.get('/:id', async (req, res) => {
  try {
    const conversation = await ProspectConversation.findById(req.params.id).populate('createdBy', 'name email')
    if (!conversation) return res.status(404).json({ error: 'No encontrada' })
    res.json(conversation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Agregar mensaje a una conversación
router.post('/:id/message', async (req, res) => {
  try {
    const { role, content } = req.body
    const conversation = await ProspectConversation.findById(req.params.id)
    if (!conversation) return res.status(404).json({ error: 'No encontrada' })
    conversation.messages.push({ role, content })
    conversation.lastUpdated = Date.now()
    await conversation.save()
    res.json(conversation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Editar datos del prospecto
router.put('/:id', async (req, res) => {
  try {
    const { prospectName, company } = req.body
    const conversation = await ProspectConversation.findByIdAndUpdate(
      req.params.id,
      { prospectName, company, lastUpdated: Date.now() },
      { new: true }
    )
    if (!conversation) return res.status(404).json({ error: 'No encontrada' })
    res.json(conversation)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

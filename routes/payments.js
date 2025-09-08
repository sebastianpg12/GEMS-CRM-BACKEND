const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// Obtener todos los pagos
router.get('/', async (req, res) => {
  const payments = await Payment.find().populate('clientId');
  res.json(payments);
});

// Crear pago
router.post('/', async (req, res) => {
  const payment = new Payment(req.body);
  await payment.save();
  res.json(payment);
});

// Actualizar pago
router.put('/:id', async (req, res) => {
  const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(payment);
});

// Eliminar pago
router.delete('/:id', async (req, res) => {
  await Payment.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;

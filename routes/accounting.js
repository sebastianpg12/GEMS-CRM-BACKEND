const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const FixedExpense = require('../models/FixedExpense');
const Payment = require('../models/Payment');

// ==================== TRANSACCIONES ====================

// Obtener todas las transacciones
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('cliente_id', 'nombre apellido email')
      .sort({ fecha: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear transacción
router.post('/transactions', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();
    
    // Si es un pago recurrente y es de tipo ingreso, crear el próximo pago
    if (transaction.es_recurrente && transaction.tipo === 'ingreso' && transaction.frecuencia) {
      const nextDate = new Date(transaction.fecha);
      if (transaction.frecuencia === 'mensual') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (transaction.frecuencia === 'trimestral') {
        nextDate.setMonth(nextDate.getMonth() + 3);
      } else if (transaction.frecuencia === 'semestral') {
        nextDate.setMonth(nextDate.getMonth() + 6);
      } else if (transaction.frecuencia === 'anual') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      transaction.proximo_pago = nextDate;
      await transaction.save();
    }
    
    await transaction.populate('cliente_id', 'nombre apellido email');
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar transacción
router.put('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate('cliente_id', 'nombre apellido email');
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar transacción
router.delete('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marcar pago como realizado (para pagos recurrentes)
router.post('/transactions/:id/mark-paid', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    
    transaction.estado_pago = 'pagado';
    transaction.fecha = new Date();
    
    // Si es recurrente, crear el próximo pago
    if (transaction.es_recurrente && transaction.frecuencia) {
      const nextTransaction = new Transaction({
        ...transaction.toObject(),
        _id: undefined,
        fecha: transaction.proximo_pago,
        estado_pago: 'pendiente',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Calcular siguiente fecha
      const nextDate = new Date(transaction.proximo_pago);
      if (transaction.frecuencia === 'mensual') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (transaction.frecuencia === 'trimestral') {
        nextDate.setMonth(nextDate.getMonth() + 3);
      } else if (transaction.frecuencia === 'semestral') {
        nextDate.setMonth(nextDate.getMonth() + 6);
      } else if (transaction.frecuencia === 'anual') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      
      nextTransaction.proximo_pago = nextDate;
      await nextTransaction.save();
    }
    
    await transaction.save();
    await transaction.populate('cliente_id', 'nombre apellido email');
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GASTOS FIJOS ====================

// Obtener todos los gastos fijos
router.get('/fixed-expenses', async (req, res) => {
  try {
    const expenses = await FixedExpense.find().sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear gasto fijo
router.post('/fixed-expenses', async (req, res) => {
  try {
    const expense = new FixedExpense(req.body);
    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar gasto fijo
router.put('/fixed-expenses/:id', async (req, res) => {
  try {
    const expense = await FixedExpense.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    
    if (!expense) {
      return res.status(404).json({ error: 'Gasto fijo no encontrado' });
    }
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar gasto fijo
router.delete('/fixed-expenses/:id', async (req, res) => {
  try {
    const expense = await FixedExpense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Gasto fijo no encontrado' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REPORTES Y RESÚMENES ====================

// Obtener resumen financiero
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        fecha: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    // Calcular ingresos y egresos
    const ingresos = await Transaction.aggregate([
      { $match: { tipo: 'ingreso', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$monto' } } }
    ]);
    
    const egresos = await Transaction.aggregate([
      { $match: { tipo: 'egreso', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$monto' } } }
    ]);
    
    // Calcular gastos fijos activos
    const gastosFijos = await FixedExpense.aggregate([
      { $match: { activo: true } },
      { $group: { _id: null, total: { $sum: '$monto_mensual' } } }
    ]);
    
    // Pagos pendientes
    const pagosPendientes = await Transaction.find({
      estado_pago: 'pendiente',
      es_recurrente: true,
      tipo: 'ingreso'
    }).populate('cliente_id', 'nombre apellido');
    
    const totalIngresos = ingresos.length > 0 ? ingresos[0].total : 0;
    const totalEgresos = egresos.length > 0 ? egresos[0].total : 0;
    const totalGastosFijos = gastosFijos.length > 0 ? gastosFijos[0].total : 0;
    
    // Los gastos fijos deben sumarse a los egresos totales para el cálculo del flujo de efectivo
    const egresosConGastosFijos = totalEgresos + totalGastosFijos;
    
    res.json({
      ingresos: totalIngresos,
      egresos: egresosConGastosFijos, // Incluye gastos fijos en egresos totales
      balance: totalIngresos - egresosConGastosFijos, // Flujo de efectivo real
      gastos_fijos_mensuales: totalGastosFijos,
      pagos_pendientes: pagosPendientes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener pagos recurrentes pendientes
router.get('/recurring-payments', async (req, res) => {
  try {
    const payments = await Transaction.find({
      es_recurrente: true,
      estado_pago: 'pendiente',
      tipo: 'ingreso',
      activo: true
    })
    .populate('cliente_id', 'nombre apellido email telefono')
    .sort({ proximo_pago: 1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

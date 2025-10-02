const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const Setting = require('../models/Setting');
const { 
  generateDailyTaskSummary, 
  generateTaskDueReminder, 
  generateTaskReport, 
  sendWhatsAppMessage 
} = require('../services/taskReportService');

// Endpoint para obtener la configuración actual de los reportes
router.get('/settings', async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: 'taskReports' });
    
    if (!settings) {
      // Configuración por defecto
      settings = new Setting({
        key: 'taskReports',
        value: {
          dailySummaryEnabled: true,
          dailySummaryTime: '23:00', // 11 PM Colombia
          dailySummaryDays: [1, 2, 3, 4, 5], // Lunes a Viernes
          dueTomorrowEnabled: true,
          dueTomorrowTime: '08:00', // 8 AM Colombia
          dueTomorrowDays: [1, 2, 3, 4, 5], // Lunes a Viernes
          dueTomorrowAdvanceDays: 1, // Notificar con 1 día de anticipación
          lastDailyRun: null,
          lastDueTomorrowRun: null
        }
      });
      await settings.save();
    }
    
    res.json(settings.value);
  } catch (error) {
    console.error('Error al obtener configuración de reportes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para actualizar la configuración de los reportes
router.put('/settings', async (req, res) => {
  try {
    const { 
      dailySummaryEnabled, 
      dailySummaryTime, 
      dailySummaryDays,
      dueTomorrowEnabled, 
      dueTomorrowTime,
      dueTomorrowDays,
      dueTomorrowAdvanceDays
    } = req.body;
    
    let settings = await Setting.findOne({ key: 'taskReports' });
    
    if (!settings) {
      settings = new Setting({ key: 'taskReports', value: {} });
    }
    
    settings.value = {
      ...settings.value,
      dailySummaryEnabled: dailySummaryEnabled !== undefined ? dailySummaryEnabled : settings.value.dailySummaryEnabled,
      dailySummaryTime: dailySummaryTime || settings.value.dailySummaryTime,
      dailySummaryDays: dailySummaryDays !== undefined ? dailySummaryDays : settings.value.dailySummaryDays || [1, 2, 3, 4, 5],
      dueTomorrowEnabled: dueTomorrowEnabled !== undefined ? dueTomorrowEnabled : settings.value.dueTomorrowEnabled,
      dueTomorrowTime: dueTomorrowTime || settings.value.dueTomorrowTime,
      dueTomorrowDays: dueTomorrowDays !== undefined ? dueTomorrowDays : settings.value.dueTomorrowDays || [1, 2, 3, 4, 5],
      dueTomorrowAdvanceDays: dueTomorrowAdvanceDays !== undefined ? dueTomorrowAdvanceDays : settings.value.dueTomorrowAdvanceDays || 1
    };
    
    await settings.save();
    
    res.json(settings.value);
  } catch (error) {
    console.error('Error al actualizar configuración de reportes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para enviar manualmente un resumen diario
router.post('/send-daily-summary', async (req, res) => {
  try {
    const baileysSock = req.app.get('baileysSock');
    const baileysReady = req.app.get('baileysReady');
    
    if (!baileysSock || !baileysReady) {
      return res.status(503).json({ error: 'WhatsApp no está conectado' });
    }
    
    const message = await generateDailyTaskSummary();
    
    const result = await sendWhatsAppMessage(baileysSock, message);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    // Actualizar la última ejecución
    let settings = await Setting.findOne({ key: 'taskReports' });
    if (settings) {
      settings.value.lastDailyRun = new Date();
      await settings.save();
    }
    
    res.json({ success: true, message: 'Resumen diario enviado correctamente' });
  } catch (error) {
    console.error('Error al enviar resumen diario:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para enviar manualmente recordatorio de vencimiento
router.post('/send-due-tomorrow', async (req, res) => {
  try {
    const baileysSock = req.app.get('baileysSock');
    const baileysReady = req.app.get('baileysReady');
    
    if (!baileysSock || !baileysReady) {
      return res.status(503).json({ error: 'WhatsApp no está conectado' });
    }
    
    const { message, mentionedJids } = await generateTaskDueReminder();
    
    const result = await sendWhatsAppMessage(baileysSock, message, mentionedJids);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    // Actualizar la última ejecución
    let settings = await Setting.findOne({ key: 'taskReports' });
    if (settings) {
      settings.value.lastDueTomorrowRun = new Date();
      await settings.save();
    }
    
    res.json({ success: true, message: 'Recordatorio de vencimiento enviado correctamente' });
  } catch (error) {
    console.error('Error al enviar recordatorio de vencimiento:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para enviar un reporte personalizado de tareas
router.post('/send-custom-report', async (req, res) => {
  try {
    const { taskIds } = req.body;
    
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron IDs de tareas' });
    }
    
    const baileysSock = req.app.get('baileysSock');
    const baileysReady = req.app.get('baileysReady');
    
    if (!baileysSock || !baileysReady) {
      return res.status(503).json({ error: 'WhatsApp no está conectado' });
    }
    
    const { message, mentionedJids } = await generateTaskReport(taskIds);
    
    const result = await sendWhatsAppMessage(baileysSock, message, mentionedJids);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    res.json({ success: true, message: 'Reporte personalizado enviado correctamente' });
  } catch (error) {
    console.error('Error al enviar reporte personalizado:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
// Backend WhatsApp vinculación y notificaciones
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const app = express();
const PORT = 3030;

let qrCode = null;
let wppReady = false;
let wppClient = null;

// Inicializa WhatsApp Web
wppClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

wppClient.on('qr', (qr) => {
    qrCode = qr;
    wppReady = false;
    console.log('QR actualizado');
});

wppClient.on('ready', () => {
    wppReady = true;
    console.log('WhatsApp vinculado y listo para enviar mensajes');
});

wppClient.initialize();

// Endpoint para obtener el QR
app.get('/api/wpp-qr', (req, res) => {
    if (qrCode && !wppReady) {
        res.json({ qr: qrCode });
    } else if (wppReady) {
        res.json({ status: 'ready' });
    } else {
        res.status(503).json({ error: 'QR no disponible aún' });
    }
});

// Función para enviar mensaje a grupo
app.use(express.json());
app.post('/api/wpp-send', async (req, res) => {
    if (!wppReady) return res.status(503).json({ error: 'WhatsApp no vinculado' });
    const { groupId, message } = req.body;
    try {
        await wppClient.sendMessage(groupId, message);
        res.json({ sent: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor WhatsApp API corriendo en http://localhost:${PORT}`);
});

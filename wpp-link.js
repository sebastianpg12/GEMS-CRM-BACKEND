// Flujo de vinculación WhatsApp Business vía QR
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.on('qr', (qr) => {
    console.log('Escanea este código QR con tu WhatsApp Business:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('¡WhatsApp vinculado y listo para enviar mensajes!');
});

client.on('auth_failure', () => {
    console.error('Error de autenticación. Vuelve a escanear el QR.');
});

client.initialize();

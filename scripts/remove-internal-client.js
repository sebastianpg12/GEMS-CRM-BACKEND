const mongoose = require('mongoose');
const Client = require('../models/Client');
require('dotenv').config();

async function removeInternalClient() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gems-crm';
    await mongoose.connect(mongoUri);
    console.log('📦 Conectado a MongoDB');

    const result = await Client.deleteMany({ name: /Internos Gems/i });
    console.log(`✅ Se eliminaron ${result.deletedCount} clientes con el nombre "Internos Gems"`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el script:', error.message);
    process.exit(1);
  }
}

removeInternalClient();

const mongoose = require('mongoose');
const Client = require('../models/Client');
const User = require('../models/User');
require('dotenv').config();

async function cleanup() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('🔗 Conectando a:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado');

    const cRes = await Client.deleteMany({ name: /Internos Gems/i });
    const uRes = await User.deleteMany({ name: /Internos Gems/i });

    console.log(`🗑️ Clientes eliminados: ${cRes.deletedCount}`);
    console.log(`🗑️ Usuarios eliminados: ${uRes.deletedCount}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

cleanup();

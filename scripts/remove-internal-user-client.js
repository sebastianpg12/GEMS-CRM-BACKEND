const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function removeInternalUserClient() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gems-crm';
    await mongoose.connect(mongoUri);
    console.log('📦 Conectado a MongoDB');

    const result = await User.deleteMany({ name: /Internos Gems/i, role: 'client' });
    console.log(`✅ Se eliminaron ${result.deletedCount} usuarios con el nombre "Internos Gems" y rol "client"`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el script:', error.message);
    process.exit(1);
  }
}

removeInternalUserClient();

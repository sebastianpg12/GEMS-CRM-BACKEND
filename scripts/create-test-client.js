const mongoose = require('mongoose');
const User = require('../models/User'); // Use the real model
require('dotenv').config();

async function createClient() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gems-crm';
    await mongoose.connect(mongoUri);
    console.log('📦 Conectado a MongoDB');

    const clientData = {
      name: 'Cliente de Prueba',
      email: 'cliente@test.com',
      password: 'cliente123',
      role: 'client'
    };

    // Check if exists
    const existing = await User.findOne({ email: clientData.email });
    if (existing) {
      console.log('⚠️ El usuario ya existe. Actualizando datos...');
      existing.name = clientData.name;
      existing.password = clientData.password;
      existing.role = clientData.role;
      await existing.save();
      console.log('✅ Usuario actualizado');
    } else {
      const newUser = new User(clientData);
      await newUser.save();
      console.log('✅ Usuario CLIENTE creado con éxito');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el script:', error.message);
    process.exit(1);
  }
}

createClient();

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUserPermissions(email) {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gems-crm');
    console.log('✅ Conectado a MongoDB');

    // Buscar el usuario específico
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log('❌ Usuario no encontrado:', email);
      return;
    }

    console.log('👤 Usuario encontrado:', user.name);
    console.log('🎭 Rol:', user.role);
    console.log('📋 Permisos completos:');
    console.log(JSON.stringify(user.permissions, null, 2));
    console.log('👥 Permisos de equipo específicamente:');
    console.log(JSON.stringify(user.permissions.team, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Ejecutar con email del empleado
const employeeEmail = process.argv[2] || 'ana.martinez@gems.com'; // Cambia este email
checkUserPermissions(employeeEmail);

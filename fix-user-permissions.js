const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function updateUserPermissions() {
  try {
    // Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gems-crm');
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los usuarios
    const users = await User.find({});
    console.log(`📊 Encontrados ${users.length} usuarios para actualizar`);

    for (const user of users) {
      console.log(`🔄 Actualizando permisos para: ${user.name} (${user.role})`);
      
      // Forzar la actualización de permisos según el rol
      switch (user.role) {
        case 'admin':
          user.permissions = {
            dashboard: true,
            clients: { view: true, create: true, edit: true, delete: true },
            activities: { view: true, create: true, edit: true, delete: true },
            reports: { view: true, export: true },
            accounting: { view: true, create: true, edit: true, delete: true },
            cases: { view: true, create: true, edit: true, delete: true },
            team: { view: true, create: true, edit: true, delete: true }
          };
          break;
        case 'manager':
          user.permissions = {
            dashboard: true,
            clients: { view: true, create: true, edit: true, delete: false },
            activities: { view: true, create: true, edit: true, delete: false },
            reports: { view: true, export: true },
            accounting: { view: true, create: true, edit: true, delete: false },
            cases: { view: true, create: true, edit: true, delete: false },
            team: { view: true, create: true, edit: true, delete: false }
          };
          break;
        case 'employee':
          user.permissions = {
            dashboard: true,
            clients: { view: false, create: false, edit: false, delete: false },
            activities: { view: true, create: true, edit: true, delete: true },
            reports: { view: false, export: false },
            accounting: { view: false, create: false, edit: false, delete: false },
            cases: { view: true, create: false, edit: false, delete: false },
            team: { view: true, create: false, edit: false, delete: false }
          };
          break;
        case 'viewer':
          user.permissions = {
            dashboard: true,
            clients: { view: true, create: false, edit: false, delete: false },
            activities: { view: true, create: false, edit: false, delete: false },
            reports: { view: false, export: false },
            accounting: { view: false, create: false, edit: false, delete: false },
            cases: { view: true, create: false, edit: false, delete: false },
            team: { view: false, create: false, edit: false, delete: false }
          };
          break;
      }
      
      // Marcar como modificado para que se guarde
      user.markModified('permissions');
      await user.save();
      console.log(`✅ Permisos actualizados para ${user.name}`);
    }

    console.log('\n🎉 ¡Todos los permisos han sido actualizados!');
    
  } catch (error) {
    console.error('❌ Error actualizando permisos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar el script
updateUserPermissions();

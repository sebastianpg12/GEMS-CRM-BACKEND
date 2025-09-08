const mongoose = require('mongoose');
const User = require('./models/User');

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-gems';

const updateUsersPermissions = async () => {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado a MongoDB');

    console.log('🔄 Actualizando permisos de usuarios...');
    
    // Obtener todos los usuarios
    const users = await User.find({});
    console.log(`📊 Encontrados ${users.length} usuarios para actualizar`);

    for (const user of users) {
      console.log(`🔄 Actualizando usuario: ${user.name} (${user.role})`);
      
      // Forzar la actualización de permisos basados en el rol
      user.markModified('role');
      await user.save();
      
      console.log(`✅ Usuario ${user.name} actualizado con permisos de ${user.role}`);
    }

    console.log('🎉 Todos los usuarios han sido actualizados con éxito');
    
    // Mostrar resumen de permisos por rol
    console.log('\n📋 Resumen de permisos por rol:');
    console.log('👑 Admin: Todos los permisos (crear, editar, eliminar en todas las secciones)');
    console.log('👨‍💼 Manager: Ver todo, crear/editar en la mayoría, no eliminar usuarios');
    console.log('👨‍💻 Employee: Ver clientes/actividades/casos, crear/editar, sin contabilidad/equipo');
    console.log('👀 Viewer: Solo visualizar clientes/actividades/casos');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔐 Conexión cerrada');
    }
    process.exit(0);
  }
};

// Ejecutar solo si se llama directamente
if (require.main === module) {
  updateUsersPermissions();
}

module.exports = updateUsersPermissions;

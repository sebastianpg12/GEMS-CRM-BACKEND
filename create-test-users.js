const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Función para crear usuarios de prueba
async function createTestUsers() {
  try {
    // Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    console.log('URI:', process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gems-crm');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gems-crm');
    console.log('✅ Conectado a MongoDB');

    // Limpiar usuarios existentes (opcional)
    // await User.deleteMany({});
    
    // Verificar si ya existen usuarios
    const existingUsersCount = await User.countDocuments();
    console.log(`📊 Usuarios existentes en la base de datos: ${existingUsersCount}`);
    
    if (existingUsersCount > 0) {
      console.log('⚠️  Ya existen usuarios en la base de datos.');
      console.log('Si quieres crear usuarios de prueba, elimina los existentes primero o comenta la verificación.');
      
      // Mostrar usuarios existentes
      const existingUsers = await User.find({}, 'name email role');
      console.log('📋 Usuarios existentes:');
      existingUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Rol: ${user.role}`);
      });
      
      process.exit(0);
    }

    // Crear usuarios de prueba
    const testUsers = [
      {
        name: 'Administrador Principal',
        email: 'admin@gems.com',
        password: 'admin123',
        role: 'admin',
        department: 'Administración',
        position: 'CEO'
      },
      {
        name: 'María García',
        email: 'maria@gems.com',
        password: 'maria123',
        role: 'manager',
        department: 'Ventas',
        position: 'Gerente de Ventas'
      },
      {
        name: 'Carlos López',
        email: 'carlos@gems.com',
        password: 'carlos123',
        role: 'employee',
        department: 'Ventas',
        position: 'Ejecutivo de Ventas'
      },
      {
        name: 'Ana Martínez',
        email: 'ana@gems.com',
        password: 'ana123',
        role: 'employee',
        department: 'Marketing',
        position: 'Analista de Marketing'
      },
      {
        name: 'José Rodríguez',
        email: 'jose@gems.com',
        password: 'jose123',
        role: 'viewer',
        department: 'Contabilidad',
        position: 'Asistente Contable'
      }
    ];

    console.log('Creando usuarios de prueba...');

    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✓ Usuario creado: ${userData.name} (${userData.email}) - Rol: ${userData.role}`);
    }

    console.log('\n🎉 ¡Usuarios de prueba creados exitosamente!');
    console.log('\nCredenciales de acceso:');
    console.log('=======================');
    
    testUsers.forEach(user => {
      console.log(`${user.name}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Contraseña: ${user.password}`);
      console.log(`  Rol: ${user.role}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error creando usuarios:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar el script
createTestUsers();

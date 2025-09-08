const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAndCreateUsers() {
  try {
    console.log('🔄 Conectando a MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB Atlas');
    
    // Contar usuarios
    const userCount = await User.countDocuments();
    console.log(`📊 Total de usuarios: ${userCount}`);
    
    if (userCount === 0) {
      console.log('⚠️ No hay usuarios. Creando usuarios de prueba...');
      
      // Crear usuarios de prueba
      const usersToCreate = [
        {
          name: 'Admin Principal',
          email: 'admin@gems.com',
          password: await bcrypt.hash('123456', 12),
          role: 'admin',
          department: 'Administración',
          position: 'Director General',
          isActive: true,
          permissions: {
            activities: { view: true, create: true, edit: true, delete: true },
            clients: { view: true, create: true, edit: true, delete: true },
            team: { view: true, create: true, edit: true, delete: true },
            reports: { view: true },
            settings: { view: true, edit: true }
          }
        },
        {
          name: 'Juan Manager',
          email: 'manager@gems.com',
          password: await bcrypt.hash('123456', 12),
          role: 'manager',
          department: 'Operaciones',
          position: 'Gerente de Operaciones',
          isActive: true,
          permissions: {
            activities: { view: true, create: true, edit: true, delete: false },
            clients: { view: true, create: true, edit: true, delete: false },
            team: { view: true, create: false, edit: true, delete: false },
            reports: { view: true }
          }
        },
        {
          name: 'María Empleada',
          email: 'empleada@gems.com',
          password: await bcrypt.hash('123456', 12),
          role: 'employee',
          department: 'Ventas',
          position: 'Ejecutiva de Ventas',
          isActive: true,
          permissions: {
            activities: { view: true, create: true, edit: true, delete: false },
            clients: { view: true, create: true, edit: true, delete: false },
            team: { view: true, create: false, edit: false, delete: false }
          }
        },
        {
          name: 'Carlos Desarrollador',
          email: 'dev@gems.com',
          password: await bcrypt.hash('123456', 12),
          role: 'employee',
          department: 'Tecnología',
          position: 'Desarrollador',
          isActive: true,
          permissions: {
            activities: { view: true, create: true, edit: true, delete: false },
            clients: { view: true, create: false, edit: false, delete: false },
            team: { view: true, create: false, edit: false, delete: false }
          }
        }
      ];

      for (const userData of usersToCreate) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Usuario creado: ${userData.name} (${userData.email})`);
      }
    }
    
    // Mostrar usuarios activos
    const users = await User.find({ isActive: true }).select('name email role department position');
    console.log('\n👥 Usuarios activos:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Rol: ${user.role} - Depto: ${user.department || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  }
}

checkAndCreateUsers();

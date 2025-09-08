const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/crmgems')
  .then(async () => {
    console.log('Conectado a MongoDB');
    
    // Contar usuarios
    const userCount = await User.countDocuments();
    console.log('Total de usuarios:', userCount);
    
    // Mostrar usuarios activos
    const users = await User.find({ isActive: true }).select('name email role department position');
    console.log('Usuarios activos:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Rol: ${user.role} - Depto: ${user.department || 'N/A'}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 Intentando conectar a MongoDB...');
    console.log('📍 URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conexión exitosa a MongoDB!');
    
    // Listar bases de datos disponibles
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('📁 Bases de datos disponibles:');
    dbs.databases.forEach(db => {
      console.log(`  - ${db.name}`);
    });
    
    // Verificar la base de datos actual
    console.log('📊 Base de datos actual:', mongoose.connection.name);
    
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('🔧 Stack completo:', error);
  }
}

testConnection();

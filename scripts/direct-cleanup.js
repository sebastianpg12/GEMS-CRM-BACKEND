const mongoose = require('mongoose');

async function cleanup() {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/gems-crm';
    console.log('🔗 Conectando a:', mongoUri);
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Conectado');

    const db = mongoose.connection.db;
    const clientRes = await db.collection('clients').deleteMany({ name: /Internos Gems/i });
    const userRes = await db.collection('users').deleteMany({ name: /Internos Gems/i });

    console.log(`🗑️ Clientes eliminados: ${clientRes.deletedCount}`);
    console.log(`🗑️ Usuarios eliminados: ${userRes.deletedCount}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

cleanup();

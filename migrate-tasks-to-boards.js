const mongoose = require('mongoose');
const Task = require('./models/Task');
const Board = require('./models/Board');
require('dotenv').config();

async function migrateTasks() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar todas las tareas sin boardId
    const tasksWithoutBoard = await Task.find({ 
      $or: [
        { boardId: null },
        { boardId: { $exists: false } }
      ]
    });

    console.log(`📋 Encontradas ${tasksWithoutBoard.length} tareas sin board`);

    if (tasksWithoutBoard.length === 0) {
      console.log('✅ Todas las tareas ya tienen un board asignado');
      process.exit(0);
    }

    // Buscar el primer board disponible
    const firstBoard = await Board.findOne().sort({ createdAt: 1 });

    if (!firstBoard) {
      console.log('❌ No hay boards disponibles. Por favor crea un board primero.');
      process.exit(1);
    }

    console.log(`📌 Asignando tareas al board: "${firstBoard.name}" (${firstBoard._id})`);

    // Actualizar todas las tareas sin boardId
    const result = await Task.updateMany(
      { 
        $or: [
          { boardId: null },
          { boardId: { $exists: false } }
        ]
      },
      { $set: { boardId: firstBoard._id } }
    );

    console.log(`✅ ${result.modifiedCount} tareas actualizadas exitosamente`);
    console.log('🎉 Migración completada');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

migrateTasks();

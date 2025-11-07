const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Board = require('../models/Board');
const { authenticateToken } = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// ==================== TAREAS ====================

// Obtener todas las tareas con filtros
router.get('/', async (req, res) => {
  try {
    const { 
      boardStatus, 
      status, 
      priority, 
      assignedTo, 
      sprint,
      type,
      tags,
      board
    } = req.query;
    
    let filter = {};
    
    // Solo filtrar por board si se proporciona
    if (board) {
      filter.boardId = board;
    }
    
    if (boardStatus) filter.boardStatus = boardStatus;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (sprint) filter['sprint.id'] = sprint;
    if (type) filter.type = type;
    if (tags) filter.tags = { $in: tags.split(',') };
    
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email photo role')
      .populate('createdBy', 'name email photo')
      .populate('parentTask', 'title type status')
      .populate('blockedBy', 'title status')
      .sort({ priority: -1, updatedAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener tareas por board status (para Kanban)
router.get('/board/:boardStatus', async (req, res) => {
  try {
    const tasks = await Task.findByBoard(req.params.boardStatus);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener tareas por sprint
router.get('/sprint/:sprintId', async (req, res) => {
  try {
    const tasks = await Task.findBySprint(req.params.sprintId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener tareas asignadas al usuario actual
router.get('/my-tasks', async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const tasks = await Task.find({ 
      assignedTo: userId,
      boardStatus: { $ne: 'done' }
    })
      .populate('assignedTo', 'name email photo')
      .populate('createdBy', 'name email')
      .sort({ priority: -1, dueDate: 1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una tarea por ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email photo role')
      .populate('createdBy', 'name email photo')
      .populate('parentTask', 'title type status')
      .populate('blockedBy', 'title status')
      .populate('relatedTasks', 'title type status')
      .populate('comments.userId', 'name email photo')
      .populate('attachments.uploadedBy', 'name email photo');
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar tarea por rama de GitHub
router.get('/github/branch/:branch', async (req, res) => {
  try {
    const task = await Task.findByGitHubBranch(req.params.branch);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada para esta rama' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nueva tarea
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const taskData = {
      ...req.body,
      createdBy: userId
    };
    
    const task = new Task(taskData);
    await task.save();
    
    await task.populate('assignedTo', 'name email photo role');
    await task.populate('createdBy', 'name email photo');
    
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar tarea
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Registrar cambios en el historial
    const changedFields = Object.keys(req.body);
    changedFields.forEach(field => {
      if (task[field] !== req.body[field]) {
        task.logChange(field, task[field], req.body[field], userId);
      }
    });
    
    // Actualizar campos
    Object.assign(task, req.body);
    await task.save();
    
    await task.populate('assignedTo', 'name email photo role');
    await task.populate('createdBy', 'name email photo');
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mover tarea en el board (cambiar boardStatus)
router.patch('/:id/move', async (req, res) => {
  try {
    const { boardStatus } = req.body;
    const userId = req.user.id || req.user._id;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    task.logChange('boardStatus', task.boardStatus, boardStatus, userId);
    task.boardStatus = boardStatus;
    
    // Si se mueve a done, marcar como completada
    if (boardStatus === 'done') {
      task.status = 'resolved';
      task.completedDate = new Date();
    }
    
    await task.save();
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Agregar comentario a tarea
router.post('/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.id || req.user._id;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    await task.addComment(userId, text);
    await task.populate('comments.userId', 'name email photo');
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Agregar adjunto a tarea
router.post('/:id/attachments', async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const attachmentData = {
      ...req.body,
      uploadedBy: userId
    };
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    await task.addAttachment(attachmentData);
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar información de GitHub
router.patch('/:id/github', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    await task.updateGitHubInfo(req.body);
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar tarea
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ESTADÍSTICAS ====================

// Obtener estadísticas de tareas
router.get('/stats/overview', async (req, res) => {
  try {
    const { sprint } = req.query;
    let filter = {};
    
    if (sprint) {
      filter['sprint.id'] = sprint;
    }
    
    const stats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: {
            $push: '$boardStatus'
          },
          byPriority: {
            $push: '$priority'
          },
          byType: {
            $push: '$type'
          },
          totalEstimatedHours: { $sum: '$estimatedHours' },
          totalActualHours: { $sum: '$actualHours' },
          avgCompletionPercentage: { $avg: '$completionPercentage' }
        }
      }
    ]);
    
    if (stats.length === 0) {
      return res.json({
        total: 0,
        byStatus: {},
        byPriority: {},
        byType: {},
        totalEstimatedHours: 0,
        totalActualHours: 0,
        avgCompletionPercentage: 0
      });
    }
    
    const result = stats[0];
    
    // Contar por categorías
    const countByArray = (arr) => {
      return arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
    };
    
    res.json({
      total: result.total,
      byStatus: countByArray(result.byStatus),
      byPriority: countByArray(result.byPriority),
      byType: countByArray(result.byType),
      totalEstimatedHours: result.totalEstimatedHours,
      totalActualHours: result.totalActualHours,
      avgCompletionPercentage: Math.round(result.avgCompletionPercentage || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

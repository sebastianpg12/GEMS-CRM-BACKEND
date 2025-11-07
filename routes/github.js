const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Board = require('../models/Board');
const githubService = require('../services/githubService');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

// Aplicar autenticación a todas las rutas excepto webhook
router.use((req, res, next) => {
  if (req.path === '/webhook') {
    return next();
  }
  return authenticateToken(req, res, next);
});

// ==================== REPOSITORIOS ====================

// Obtener repositorios
router.get('/repos/:owner', async (req, res) => {
  try {
    const repos = await githubService.listRepositories(req.params.owner);
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener información de un repositorio
router.get('/repos/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoInfo = await githubService.getRepository(owner, repo);
    res.json(repoInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RAMAS ====================

// Listar ramas de un repositorio
router.get('/repos/:owner/:repo/branches', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const branches = await githubService.listBranches(owner, repo);
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear rama desde una tarea
router.post('/tasks/:taskId/create-branch', async (req, res) => {
  try {
    const { baseBranch } = req.body;
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    if (!task.github.repoOwner || !task.github.repoName) {
      return res.status(400).json({ error: 'Tarea no tiene repositorio configurado' });
    }
    
    // Generar nombre de rama
    const branchName = githubService.generateBranchName(
      task.type,
      task._id.toString().substring(0, 8),
      task.title
    );
    
    // Crear rama en GitHub
    const branch = await githubService.createBranch(
      task.github.repoOwner,
      task.github.repoName,
      branchName,
      baseBranch || 'main'
    );
    
    // Actualizar tarea con info de la rama
    task.github.branch = branchName;
    task.github.branchUrl = `https://github.com/${task.github.repoOwner}/${task.github.repoName}/tree/${branchName}`;
    task.github.lastSync = new Date();
    await task.save();
    
    res.json({
      task,
      branch
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== COMMITS ====================

// Obtener commits de una rama de tarea
router.get('/tasks/:taskId/commits', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    if (!task.github.branch) {
      return res.status(400).json({ error: 'Tarea no tiene rama asignada' });
    }
    
    const commits = await githubService.listCommits(
      task.github.repoOwner,
      task.github.repoName,
      task.github.branch
    );
    
    // Actualizar commits en la tarea
    task.github.commits = commits.map(c => githubService.formatCommitForTask(c));
    task.github.lastSync = new Date();
    await task.save();
    
    res.json(commits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PULL REQUESTS ====================

// Listar PRs de un repositorio
router.get('/repos/:owner/:repo/pulls', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { state } = req.query;
    
    const pulls = await githubService.listPullRequests(owner, repo, state || 'open');
    res.json(pulls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear PR desde una tarea
router.post('/tasks/:taskId/create-pr', async (req, res) => {
  try {
    const { title, body, base } = req.body;
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    if (!task.github.branch) {
      return res.status(400).json({ error: 'Tarea no tiene rama asignada' });
    }
    
    // Crear PR en GitHub
    const pr = await githubService.createPullRequest(
      task.github.repoOwner,
      task.github.repoName,
      title || task.title,
      task.github.branch,
      base || 'main',
      body || task.description
    );
    
    // Actualizar tarea con info del PR
    task.github.pullRequest = githubService.formatPRForTask(pr);
    task.github.lastSync = new Date();
    
    // Mover tarea a review si no está ahí
    if (task.boardStatus !== 'review' && task.boardStatus !== 'done') {
      task.boardStatus = 'review';
    }
    
    await task.save();
    
    res.json({
      task,
      pullRequest: pr
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sincronizar estado de PR con tarea
router.post('/tasks/:taskId/sync-pr', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    if (!task.github.pullRequest || !task.github.pullRequest.number) {
      return res.status(400).json({ error: 'Tarea no tiene PR asignado' });
    }
    
    // Obtener estado actual del PR
    const pr = await githubService.getPullRequest(
      task.github.repoOwner,
      task.github.repoName,
      task.github.pullRequest.number
    );
    
    // Actualizar info del PR
    task.github.pullRequest = githubService.formatPRForTask(pr);
    task.github.lastSync = new Date();
    
    // Si el PR fue mergeado, mover tarea a done
    if (pr.merged) {
      task.boardStatus = 'done';
      task.status = 'resolved';
      task.completedDate = new Date(pr.merged_at);
    }
    
    await task.save();
    
    res.json({
      task,
      pullRequest: pr
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== WEBHOOK ====================

// Webhook para recibir eventos de GitHub
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    
    // Verificar firma (si hay secret configurado)
    if (process.env.GITHUB_WEBHOOK_SECRET) {
      const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
      const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
      
      if (signature !== digest) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    const payload = req.body;
    
    // Manejar evento de push
    if (event === 'push') {
      const branch = payload.ref.replace('refs/heads/', '');
      const commits = payload.commits;
      
      // Buscar tarea por rama
      const task = await Task.findByGitHubBranch(branch);
      
      if (task) {
        // Agregar commits a la tarea
        const newCommits = commits.map(c => ({
          sha: c.id,
          message: c.message,
          author: c.author.name,
          date: c.timestamp,
          url: c.url
        }));
        
        task.github.commits.push(...newCommits);
        task.github.lastSync = new Date();
        
        // Si está en backlog o todo, moverla a in-progress
        if (task.boardStatus === 'backlog' || task.boardStatus === 'todo') {
          task.boardStatus = 'in-progress';
          task.status = 'active';
        }
        
        await task.save();
      }
    }
    
    // Manejar evento de pull request
    if (event === 'pull_request') {
      const action = payload.action;
      const pr = payload.pull_request;
      const branch = pr.head.ref;
      
      // Buscar tarea por rama
      const task = await Task.findByGitHubBranch(branch);
      
      if (task) {
        // Actualizar info del PR
        task.github.pullRequest = githubService.formatPRForTask(pr);
        task.github.lastSync = new Date();
        
        // Actualizar estado según acción
        if (action === 'opened') {
          task.boardStatus = 'review';
        } else if (action === 'closed' && pr.merged) {
          task.boardStatus = 'done';
          task.status = 'resolved';
          task.completedDate = new Date();
        }
        
        await task.save();
      }
    }
    
    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Configurar webhook para un board
router.post('/boards/:boardId/setup-webhook', async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    
    if (!board) {
      return res.status(404).json({ error: 'Board no encontrado' });
    }
    
    if (!board.github.connected) {
      return res.status(400).json({ error: 'Board no está conectado a GitHub' });
    }
    
    const webhookUrl = `${process.env.APP_URL || 'http://localhost:4000'}/api/github/webhook`;
    const secret = process.env.GITHUB_WEBHOOK_SECRET || crypto.randomBytes(20).toString('hex');
    
    // Crear webhook en GitHub
    const webhook = await githubService.createWebhook(
      board.github.repoOwner,
      board.github.repoName,
      webhookUrl,
      secret,
      ['push', 'pull_request', 'issues']
    );
    
    // Guardar info del webhook en el board
    board.github.webhookId = webhook.id;
    board.github.webhookSecret = secret;
    await board.save();
    
    res.json({
      board,
      webhook
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

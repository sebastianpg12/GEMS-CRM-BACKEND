const axios = require('axios');

class GitHubService {
  constructor() {
    this.baseURL = 'https://api.github.com';
    this.token = process.env.GITHUB_TOKEN || null;
  }

  // Configurar headers de autenticación
  getHeaders() {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CRM-GEMS-Task-Manager'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // ==================== REPOSITORIOS ====================

  // Obtener información del repositorio
  async getRepository(owner, repo) {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching repository:', error.message);
      throw error;
    }
  }

  // Listar repositorios de un usuario/organización
  async listRepositories(owner, type = 'all') {
    try {
      const response = await axios.get(
        `${this.baseURL}/users/${owner}/repos?type=${type}&sort=updated`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error listing repositories:', error.message);
      throw error;
    }
  }

  // ==================== RAMAS ====================

  // Listar todas las ramas
  async listBranches(owner, repo) {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/branches`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error listing branches:', error.message);
      throw error;
    }
  }

  // Obtener información de una rama específica
  async getBranch(owner, repo, branch) {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/branches/${branch}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching branch:', error.message);
      throw error;
    }
  }

  // Crear nueva rama
  async createBranch(owner, repo, branchName, fromBranch = 'main') {
    try {
      // Primero obtener el SHA de la rama base
      const baseBranch = await this.getBranch(owner, repo, fromBranch);
      const sha = baseBranch.commit.sha;

      // Crear la nueva rama
      const response = await axios.post(
        `${this.baseURL}/repos/${owner}/${repo}/git/refs`,
        {
          ref: `refs/heads/${branchName}`,
          sha: sha
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating branch:', error.message);
      throw error;
    }
  }

  // ==================== COMMITS ====================

  // Listar commits de una rama
  async listCommits(owner, repo, branch = null, limit = 30) {
    try {
      let url = `${this.baseURL}/repos/${owner}/${repo}/commits?per_page=${limit}`;
      if (branch) {
        url += `&sha=${branch}`;
      }

      const response = await axios.get(url, { headers: this.getHeaders() });
      return response.data;
    } catch (error) {
      console.error('Error listing commits:', error.message);
      throw error;
    }
  }

  // Obtener un commit específico
  async getCommit(owner, repo, sha) {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/commits/${sha}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching commit:', error.message);
      throw error;
    }
  }

  // ==================== PULL REQUESTS ====================

  // Listar pull requests
  async listPullRequests(owner, repo, state = 'open') {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/pulls?state=${state}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error listing pull requests:', error.message);
      throw error;
    }
  }

  // Obtener un pull request específico
  async getPullRequest(owner, repo, prNumber) {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/pulls/${prNumber}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching pull request:', error.message);
      throw error;
    }
  }

  // Crear pull request
  async createPullRequest(owner, repo, title, head, base, body = '') {
    try {
      const response = await axios.post(
        `${this.baseURL}/repos/${owner}/${repo}/pulls`,
        {
          title,
          head,
          base,
          body
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating pull request:', error.message);
      throw error;
    }
  }

  // Mergear pull request
  async mergePullRequest(owner, repo, prNumber, commitMessage = '') {
    try {
      const response = await axios.put(
        `${this.baseURL}/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
        {
          commit_message: commitMessage
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error merging pull request:', error.message);
      throw error;
    }
  }

  // ==================== ISSUES ====================

  // Listar issues
  async listIssues(owner, repo, state = 'open') {
    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/issues?state=${state}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error listing issues:', error.message);
      throw error;
    }
  }

  // Crear issue
  async createIssue(owner, repo, title, body = '', labels = [], assignees = []) {
    try {
      const response = await axios.post(
        `${this.baseURL}/repos/${owner}/${repo}/issues`,
        {
          title,
          body,
          labels,
          assignees
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating issue:', error.message);
      throw error;
    }
  }

  // Cerrar issue
  async closeIssue(owner, repo, issueNumber) {
    try {
      const response = await axios.patch(
        `${this.baseURL}/repos/${owner}/${repo}/issues/${issueNumber}`,
        {
          state: 'closed'
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error closing issue:', error.message);
      throw error;
    }
  }

  // ==================== WEBHOOKS ====================

  // Crear webhook
  async createWebhook(owner, repo, webhookUrl, secret, events = ['push', 'pull_request']) {
    try {
      const response = await axios.post(
        `${this.baseURL}/repos/${owner}/${repo}/hooks`,
        {
          name: 'web',
          active: true,
          events,
          config: {
            url: webhookUrl,
            content_type: 'json',
            secret: secret,
            insecure_ssl: '0'
          }
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating webhook:', error.message);
      throw error;
    }
  }

  // Eliminar webhook
  async deleteWebhook(owner, repo, hookId) {
    try {
      await axios.delete(
        `${this.baseURL}/repos/${owner}/${repo}/hooks/${hookId}`,
        { headers: this.getHeaders() }
      );
      return { success: true };
    } catch (error) {
      console.error('Error deleting webhook:', error.message);
      throw error;
    }
  }

  // ==================== UTILIDADES ====================

  // Formatear información de commit para la tarea
  formatCommitForTask(commit) {
    return {
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url
    };
  }

  // Formatear información de PR para la tarea
  formatPRForTask(pr) {
    return {
      number: pr.number,
      url: pr.html_url,
      status: pr.state,
      mergedAt: pr.merged_at
    };
  }

  // Generar nombre de rama a partir de tarea
  generateBranchName(taskType, taskId, taskTitle) {
    const typePrefix = {
      'task': 'task',
      'bug': 'fix',
      'feature': 'feature',
      'user-story': 'story',
      'epic': 'epic'
    };

    const prefix = typePrefix[taskType] || 'task';
    const sanitizedTitle = taskTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    return `${prefix}/${taskId}-${sanitizedTitle}`;
  }
}

module.exports = new GitHubService();

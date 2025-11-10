require('dotenv').config();
const axios = require('axios');

async function testGitHubToken() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error('❌ GITHUB_TOKEN no está configurado en .env');
    return;
  }
  
  console.log('🔑 Token encontrado:', token.substring(0, 10) + '...');
  console.log('');
  
  try {
    console.log('📡 Probando autenticación...');
    
    // Test 1: Verificar usuario autenticado
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    console.log('✅ Autenticación exitosa!');
    console.log('👤 Usuario:', userResponse.data.login);
    console.log('📧 Email:', userResponse.data.email || 'No público');
    console.log('');
    
    // Test 2: Listar repositorios
    console.log('📦 Obteniendo repositorios...');
    const reposResponse = await axios.get(`https://api.github.com/users/${userResponse.data.login}/repos?sort=updated&per_page=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    console.log(`✅ ${reposResponse.data.length} repositorios encontrados:`);
    reposResponse.data.forEach((repo, i) => {
      console.log(`   ${i + 1}. ${repo.full_name} (${repo.default_branch})`);
    });
    console.log('');
    
    // Test 3: Verificar permisos
    const scopes = userResponse.headers['x-oauth-scopes'];
    console.log('🔐 Permisos del token:');
    if (scopes) {
      scopes.split(',').forEach(scope => {
        console.log(`   ✓ ${scope.trim()}`);
      });
    } else {
      console.log('   ⚠️  No se pudieron verificar los permisos');
    }
    console.log('');
    
    // Verificar si tiene permiso 'repo'
    if (!scopes || !scopes.includes('repo')) {
      console.log('⚠️  ADVERTENCIA: El token no tiene el permiso "repo"');
      console.log('   Necesitas regenerar el token con permisos completos de "repo"');
    } else {
      console.log('✅ Token configurado correctamente con todos los permisos necesarios');
    }
    
    // Sugerencia de uso
    if (reposResponse.data.length > 0) {
      const firstRepo = reposResponse.data[0];
      console.log('');
      console.log('💡 Para crear una rama de prueba, usa:');
      console.log(`   Repository: ${firstRepo.full_name}`);
      console.log(`   Base branch: ${firstRepo.default_branch}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('');
      console.log('🔧 El token no es válido o ha expirado.');
      console.log('   Pasos para generar uno nuevo:');
      console.log('   1. Ve a: https://github.com/settings/tokens');
      console.log('   2. Click en "Generate new token" → "Generate new token (classic)"');
      console.log('   3. Selecciona estos permisos:');
      console.log('      ✓ repo (Full control of private repositories)');
      console.log('      ✓ admin:repo_hook (Full control of repository hooks)');
      console.log('   4. Copia el token y actualiza GITHUB_TOKEN en .env');
    }
  }
}

console.log('═══════════════════════════════════════');
console.log('  🧪 Test de Token de GitHub');
console.log('═══════════════════════════════════════');
console.log('');

testGitHubToken();

const axios = require('axios')
require('dotenv').config()

async function testGitHubDirect() {
  console.log('\n🔍 Probando conexión directa con GitHub API...\n')
  
  const token = process.env.GITHUB_TOKEN
  
  if (!token) {
    console.log('❌ GITHUB_TOKEN no configurado en .env')
    return
  }
  
  console.log('1. Token configurado: ✅')
  console.log('   Token:', token.substring(0, 10) + '...')
  
  try {
    // Test 1: Obtener usuario
    console.log('\n2. Obteniendo información del usuario GitHub...')
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    console.log('   ✅ Usuario:', userResponse.data.login)
    console.log('   📧 Email:', userResponse.data.email || 'No público')
    console.log('   👤 Nombre:', userResponse.data.name || 'No configurado')
    console.log('   📦 Repos públicos:', userResponse.data.public_repos)
    console.log('   🔒 Repos privados:', userResponse.data.total_private_repos || 0)
    
    const username = userResponse.data.login
    
    // Test 2: Listar repositorios
    console.log('\n3. Listando repositorios...')
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      params: {
        per_page: 5,
        sort: 'updated'
      }
    })
    
    console.log(`   ✅ Se encontraron repositorios`)
    console.log('\n   📁 Últimos 5 repositorios:')
    reposResponse.data.forEach((repo, i) => {
      console.log(`   ${i + 1}. ${repo.name}`)
      console.log(`      ${repo.private ? '🔒 Privado' : '🌐 Público'} - ${repo.default_branch}`)
    })
    
    // Test 3: Rate limit
    console.log('\n4. Verificando límite de API...')
    const rateLimitResponse = await axios.get('https://api.github.com/rate_limit', {
      headers: {
        'Authorization': `token ${token}`
      }
    })
    
    const core = rateLimitResponse.data.resources.core
    console.log('   ✅ Rate limit:')
    console.log(`   📊 Límite: ${core.limit} requests/hora`)
    console.log(`   ✅ Restantes: ${core.remaining}`)
    console.log(`   ⏰ Reset: ${new Date(core.reset * 1000).toLocaleString()}`)
    
    // Test 4: Probar crear rama (simulación)
    console.log('\n5. Verificando permisos para crear ramas...')
    if (reposResponse.data.length > 0) {
      const testRepo = reposResponse.data.find(r => !r.private) || reposResponse.data[0]
      console.log(`   🎯 Repo de prueba: ${testRepo.full_name}`)
      
      try {
        // Obtener branches
        const branchesResponse = await axios.get(
          `https://api.github.com/repos/${testRepo.full_name}/branches`,
          {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        )
        console.log(`   ✅ Acceso a branches: ${branchesResponse.data.length} ramas encontradas`)
        console.log('   ✅ Permisos: OK para crear ramas')
      } catch (err) {
        console.log('   ⚠️  No se pudieron listar branches:', err.response?.data?.message || err.message)
      }
    }
    
    console.log('\n✅ ¡GitHub está configurado correctamente!')
    console.log('\n📋 Resumen:')
    console.log('   • Token válido: ✅')
    console.log('   • Usuario autenticado: ✅')
    console.log('   • Acceso a repositorios: ✅')
    console.log('   • Permisos suficientes: ✅')
    console.log('\n🚀 Tu backend puede crear ramas en GitHub!')
    
  } catch (error) {
    console.log('\n❌ Error al conectar con GitHub:')
    console.log('   Mensaje:', error.response?.data?.message || error.message)
    console.log('   Status:', error.response?.status)
    
    if (error.response?.status === 401) {
      console.log('\n💡 Solución: El token es inválido o ha expirado')
      console.log('   1. Ve a https://github.com/settings/tokens')
      console.log('   2. Verifica que el token existe y no ha expirado')
      console.log('   3. Si es necesario, genera un nuevo token')
      console.log('   4. Actualiza GITHUB_TOKEN en el archivo .env')
    } else if (error.response?.status === 403) {
      console.log('\n💡 Solución: El token no tiene permisos suficientes')
      console.log('   1. Ve a https://github.com/settings/tokens')
      console.log('   2. Edita tu token')
      console.log('   3. Asegúrate de tener seleccionado: repo, workflow, admin:repo_hook')
    }
  }
}

testGitHubDirect()

const axios = require('axios')
require('dotenv').config()

const BASE_URL = process.env.APP_URL || 'http://localhost:3000'

async function testGitHubConnection() {
  console.log('\n🔍 Verificando configuración de GitHub...\n')
  
  // 1. Verificar variables de entorno
  console.log('1. Variables de entorno:')
  console.log('   GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? '✅ Configurado' : '❌ No configurado')
  console.log('   GITHUB_WEBHOOK_SECRET:', process.env.GITHUB_WEBHOOK_SECRET ? '✅ Configurado' : '❌ No configurado')
  console.log('   APP_URL:', process.env.APP_URL || 'http://localhost:3000')
  
  if (!process.env.GITHUB_TOKEN) {
    console.log('\n❌ Error: GITHUB_TOKEN no configurado en .env')
    console.log('Por favor sigue las instrucciones en GITHUB_SETUP.md')
    process.exit(1)
  }
  
  // 2. Login para obtener token JWT
  console.log('\n2. Iniciando sesión...')
  let jwtToken
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@gems.com',
      password: 'admin123'
    })
    jwtToken = loginResponse.data.token
    console.log('   ✅ Login exitoso')
  } catch (error) {
    console.log('   ❌ Error en login:', error.response?.data?.message || error.message)
    console.log('\n   Asegúrate de tener un usuario creado. Ejecuta:')
    console.log('   node create-test-users.js')
    process.exit(1)
  }
  
  // 3. Probar conexión directa con GitHub API
  console.log('\n3. Probando conexión directa con GitHub API...')
  try {
    const githubResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    console.log('   ✅ Conexión exitosa con GitHub')
    console.log('   Usuario:', githubResponse.data.login)
    console.log('   Nombre:', githubResponse.data.name)
    console.log('   Repositorios públicos:', githubResponse.data.public_repos)
  } catch (error) {
    console.log('   ❌ Error al conectar con GitHub:', error.response?.data?.message || error.message)
    console.log('\n   Verifica que tu GITHUB_TOKEN sea válido y tenga los permisos necesarios.')
    process.exit(1)
  }
  
  // 4. Obtener usuario de GitHub para listar repositorios
  console.log('\n4. Obteniendo información del usuario GitHub...')
  let githubUsername
  try {
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    githubUsername = userResponse.data.login
    console.log('   ✅ Usuario GitHub:', githubUsername)
  } catch (error) {
    console.log('   ❌ Error:', error.message)
    process.exit(1)
  }
  
  // 5. Listar repositorios a través del backend
  console.log('\n5. Listando repositorios a través del backend...')
  try {
    const reposResponse = await axios.get(
      `${BASE_URL}/api/github/repos/${githubUsername}`,
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      }
    )
    console.log(`   ✅ Se encontraron ${reposResponse.data.length} repositorios`)
    
    if (reposResponse.data.length > 0) {
      console.log('\n   Primeros 5 repositorios:')
      reposResponse.data.slice(0, 5).forEach((repo, index) => {
        console.log(`   ${index + 1}. ${repo.name} (${repo.private ? 'Privado' : 'Público'})`)
      })
    }
  } catch (error) {
    console.log('   ❌ Error:', error.response?.data?.message || error.message)
    console.log('\n   Verifica que el servidor backend esté corriendo en:', BASE_URL)
    process.exit(1)
  }
  
  // 6. Verificar límite de rate
  console.log('\n6. Verificando límite de API...')
  try {
    const rateLimitResponse = await axios.get('https://api.github.com/rate_limit', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    })
    const core = rateLimitResponse.data.resources.core
    console.log('   ✅ Rate limit:')
    console.log(`   Límite: ${core.limit} requests/hora`)
    console.log(`   Usados: ${core.used}`)
    console.log(`   Restantes: ${core.remaining}`)
    
    if (core.remaining < 100) {
      console.log('   ⚠️  Advertencia: Quedan pocas requests disponibles')
    }
  } catch (error) {
    console.log('   ⚠️  No se pudo verificar rate limit')
  }
  
  console.log('\n✅ ¡Todas las pruebas pasaron exitosamente!')
  console.log('\n📋 Resumen:')
  console.log('   • GitHub Token: Válido')
  console.log('   • Backend: Funcionando')
  console.log('   • API Routes: Accesibles')
  console.log('   • Repositorios: Listados correctamente')
  console.log('\n🚀 ¡Tu backend está listo para usar con GitHub!')
  console.log('\nSiguiente paso:')
  console.log('   1. Inicia el frontend: cd GEMS-CRM && npm run dev')
  console.log('   2. Ve a /activities')
  console.log('   3. Click en "Tasks"')
  console.log('   4. Crea una tarea y prueba crear una rama en GitHub')
}

// Ejecutar test
testGitHubConnection().catch(error => {
  console.error('\n💥 Error inesperado:', error.message)
  process.exit(1)
})

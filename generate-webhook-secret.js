const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

console.log('\n🔐 Generador de Secreto para GitHub Webhook\n')

// Generar secreto aleatorio
const secret = crypto.randomBytes(32).toString('hex')

console.log('Tu nuevo GITHUB_WEBHOOK_SECRET:')
console.log('━'.repeat(70))
console.log(secret)
console.log('━'.repeat(70))

// Leer .env actual
const envPath = path.join(__dirname, '.env')
let envContent = ''

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
  
  // Reemplazar el webhook secret
  if (envContent.includes('GITHUB_WEBHOOK_SECRET=')) {
    envContent = envContent.replace(
      /GITHUB_WEBHOOK_SECRET=.*/,
      `GITHUB_WEBHOOK_SECRET=${secret}`
    )
    
    fs.writeFileSync(envPath, envContent)
    console.log('\n✅ Archivo .env actualizado con el nuevo secreto')
  } else {
    console.log('\n⚠️  GITHUB_WEBHOOK_SECRET no encontrado en .env')
    console.log('Agrégalo manualmente:')
    console.log(`GITHUB_WEBHOOK_SECRET=${secret}`)
  }
} else {
  console.log('\n⚠️  Archivo .env no encontrado')
  console.log('Crea un archivo .env con:')
  console.log(`GITHUB_WEBHOOK_SECRET=${secret}`)
}

console.log('\n📋 Pasos siguientes:')
console.log('1. Ve a https://github.com/settings/tokens')
console.log('2. Crea un nuevo Personal Access Token (classic)')
console.log('3. Selecciona los scopes: repo, workflow, admin:repo_hook')
console.log('4. Copia el token y actualiza GITHUB_TOKEN en .env')
console.log('5. Ejecuta: node test-github-setup.js')
console.log('')

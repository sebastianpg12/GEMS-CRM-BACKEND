# Configuración de GitHub para Azure DevOps Integration

## 1. Crear Personal Access Token (Classic)

### Paso 1: Ve a GitHub Settings
1. Ve a https://github.com/settings/tokens
2. O navega: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

### Paso 2: Generate new token (classic)
Click en "Generate new token (classic)"

### Paso 3: Configurar el token
**Note/Nombre**: `GEMS-CRM-Backend-Integration`

**Expiration**: `No expiration` o `1 year` (recomendado: 90 días y renovar)

**Select scopes** (permisos necesarios):
- ✅ **repo** (Full control of private repositories)
  - ✅ repo:status
  - ✅ repo_deployment
  - ✅ public_repo
  - ✅ repo:invite
  - ✅ security_events
- ✅ **workflow** (Update GitHub Action workflows)
- ✅ **admin:repo_hook** (Full control of repository hooks)
  - ✅ write:repo_hook
  - ✅ read:repo_hook

### Paso 4: Generate token
1. Click en "Generate token" al final
2. **IMPORTANTE**: Copia el token INMEDIATAMENTE (solo se muestra una vez)
3. El token será algo como: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 2. Configurar el Backend

### Opción A: Archivo .env (Desarrollo local)

Edita el archivo `.env` en la carpeta `back-crm-gems`:

```env
# GitHub Integration
GITHUB_TOKEN=ghp_tu_token_aqui_copiado_de_github
GITHUB_WEBHOOK_SECRET=tu_secreto_aleatorio_seguro_aqui

# Ejemplo:
# GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuv
# GITHUB_WEBHOOK_SECRET=mi_secreto_super_seguro_123456
```

### Opción B: Variables de Entorno (Producción)

Si vas a desplegar en un servidor, configura estas variables:

```bash
# En Linux/Mac
export GITHUB_TOKEN="ghp_tu_token"
export GITHUB_WEBHOOK_SECRET="tu_secreto"

# En Windows PowerShell
$env:GITHUB_TOKEN="ghp_tu_token"
$env:GITHUB_WEBHOOK_SECRET="tu_secreto"

# En servicios cloud (Railway, Heroku, Vercel, etc.)
# Agrega estas variables en el panel de configuración
```

---

## 3. Generar un Webhook Secret

El webhook secret es una cadena aleatoria para validar que los webhooks vienen de GitHub.

### Opción 1: Usar OpenSSL (Linux/Mac/Git Bash)
```bash
openssl rand -hex 32
```

### Opción 2: Usar Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Opción 3: Usar PowerShell
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Opción 4: Generador online
Ve a: https://randomkeygen.com/ y usa una "Fort Knox Password"

---

## 4. Configurar Webhooks en GitHub (Opcional - Para notificaciones automáticas)

### Desde la aplicación:
Una vez que tengas las credenciales configuradas, puedes configurar webhooks desde la UI:

1. Ve a tu tablero de tareas
2. Click en "Configurar GitHub"
3. Selecciona el repositorio
4. Click en "Setup Webhook"

### Manual desde GitHub:
1. Ve a tu repositorio → Settings → Webhooks → Add webhook
2. **Payload URL**: `https://tu-dominio.com/api/github/webhook`
3. **Content type**: `application/json`
4. **Secret**: El mismo `GITHUB_WEBHOOK_SECRET` de tu .env
5. **Events**: Selecciona:
   - ✅ Push events
   - ✅ Pull requests
   - ✅ Branches or tags creation
6. Click "Add webhook"

---

## 5. Verificar la Configuración

### Desde el backend:
```bash
cd back-crm-gems
npm run dev
```

En otra terminal, prueba el endpoint:
```bash
# Windows PowerShell
curl http://localhost:3000/api/github/test -H "Authorization: Bearer tu_token_jwt"

# O con Node.js
node test-github-connection.js
```

### Crear archivo de prueba:
Crea `test-github-connection.js` en `back-crm-gems`:

```javascript
const axios = require('axios')

async function testGitHub() {
  try {
    // 1. Login primero
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'tu_email@example.com',
      password: 'tu_password'
    })
    
    const token = loginResponse.data.token
    
    // 2. Probar endpoint de GitHub
    const githubResponse = await axios.get(
      'http://localhost:3000/api/github/repos/tu-usuario-github',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    
    console.log('✅ GitHub conectado correctamente!')
    console.log('Repositorios encontrados:', githubResponse.data.length)
    console.log('Primer repo:', githubResponse.data[0]?.name)
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message)
  }
}

testGitHub()
```

---

## 6. Troubleshooting

### Error: "Bad credentials"
- Verifica que copiaste el token completo
- Asegúrate que el token no tiene espacios al inicio/final
- Verifica que el token no haya expirado

### Error: "Resource not accessible"
- Revisa que el token tenga los permisos correctos (scopes)
- Regenera el token con todos los scopes necesarios

### Error: "Rate limit exceeded"
- GitHub tiene límite de 5000 requests/hora con token
- Sin token solo permite 60 requests/hora

### Webhook no funciona
- Verifica que el `GITHUB_WEBHOOK_SECRET` sea exactamente el mismo en ambos lados
- Asegúrate que tu backend esté accesible públicamente
- Revisa los logs de entrega en GitHub → Repo → Settings → Webhooks

---

## 7. Seguridad

### ⚠️ IMPORTANTE - Nunca compartas tu token:
- ❌ NO lo subas a GitHub en el código
- ❌ NO lo pongas en archivos de configuración versionados
- ✅ Usa variables de entorno
- ✅ Agrega `.env` al `.gitignore`
- ✅ Rota el token periódicamente

### Archivo .gitignore debe incluir:
```
.env
.env.local
.env.*.local
```

---

## 8. Siguiente Paso

Una vez configurado:
1. Reinicia el servidor backend
2. Abre el frontend
3. Ve a la sección de Tasks
4. Crea una tarea
5. Click en "Crear rama"
6. ¡Listo! La rama se creará automáticamente en GitHub

---

## Resumen Rápido

```bash
# 1. Crea token en GitHub con permisos: repo, workflow, admin:repo_hook
# 2. Genera un secreto aleatorio
# 3. Edita .env:

GITHUB_TOKEN=ghp_tu_token_de_github
GITHUB_WEBHOOK_SECRET=tu_secreto_aleatorio

# 4. Reinicia el servidor
npm run dev

# 5. ¡Listo para usar!
```

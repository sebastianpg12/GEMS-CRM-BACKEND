# GEMS CRM Backend API 🚀

Backend completo para el sistema CRM de GEMS Innovations, construido con Node.js, Express.js y MongoDB.

## 🏗️ Arquitectura

### Stack Tecnológico
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de Datos**: MongoDB con Mongoose ODM
- **Autenticación**: JWT (JSON Web Tokens)
- **Upload de Archivos**: Multer
- **Validación**: Mongoose Schema Validation
- **CORS**: Configuración completa para frontend

### Estructura del Proyecto
```
back-crm-gems/
├── models/           # Modelos de MongoDB (Mongoose)
├── routes/          # Rutas de la API REST
├── middleware/      # Middleware de autenticación y autorización
├── uploads/         # Archivos subidos por usuarios
├── config.js        # Configuración de base de datos
├── index.js         # Servidor principal
└── package.json     # Dependencias y scripts
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- MongoDB (local o Atlas)
- npm o yarn

### Configuración
1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Editar `.env` con tus credenciales:
```
MONGODB_URI=tu_uri_de_mongodb
JWT_SECRET=tu_jwt_secret_super_seguro
PORT=5000
```

4. Iniciar el servidor:
```bash
npm start
```

## 📊 Modelos de Datos

### User (Usuario)
- Gestión completa de usuarios con roles y permisos
- Campos: name, email, password, role, permissions, photo
- Roles: admin, manager, employee, client

### Activity (Actividad)
- Sistema de actividades con asignaciones y estados
- Estados: pending, in_progress, completed, cancelled, overdue
- Asignaciones con populate de usuario

### Client (Cliente)
- Gestión de clientes con información completa
- Documentos asociados y historial

### Case (Caso)
- Casos legales/comerciales con seguimiento
- Estados y documentación asociada

### Payment (Pago) & Transaction (Transacción)
- Sistema de contabilidad completo
- Pagos, transacciones y gastos fijos

## 🛠️ API Endpoints

### Autenticación
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/register` - Registro (admin only)
- `GET /api/auth/profile` - Perfil del usuario actual

### Usuarios
- `GET /api/team` - Listar equipo
- `PUT /api/team/:id` - Actualizar usuario
- `POST /api/team/:id/photo` - Subir foto de perfil

### Actividades
- `GET /api/activities` - Listar actividades
- `POST /api/activities` - Crear actividad
- `PUT /api/activities/:id` - Actualizar actividad
- `DELETE /api/activities/:id` - Eliminar actividad
- `PUT /api/activities/:id/status` - Cambiar estado

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Crear cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente

### Casos
- `GET /api/cases` - Listar casos
- `POST /api/cases` - Crear caso
- `PUT /api/cases/:id` - Actualizar caso

### Contabilidad
- `GET /api/payments` - Listar pagos
- `POST /api/payments` - Crear pago
- `GET /api/accounting` - Dashboard contable
- `GET /api/reports/financial` - Reportes financieros

## 🔒 Sistema de Permisos

### Roles y Permisos
- **Admin**: Acceso completo al sistema
- **Manager**: Gestión de equipo y reportes
- **Employee**: Operaciones básicas
- **Client**: Solo sus propios datos

### Middleware de Autorización
```javascript
// Verificar autenticación
app.use('/api', authMiddleware);

// Verificar permisos específicos
app.get('/api/admin/*', requirePermissions(['admin']));
```

## 📤 Upload de Archivos

Sistema completo de upload con Multer:
- Fotos de perfil de usuarios
- Documentos de clientes
- Archivos de casos
- Comprobantes de pago

## 🔧 Scripts Utilitarios

### Gestión de Usuarios
- `create-test-users.js` - Crear usuarios de prueba
- `fix-user-permissions.js` - Corregir permisos
- `update-user-permissions.js` - Actualizar permisos

### Testing
- `test-connection.js` - Probar conexión a MongoDB
- `debug-permissions.js` - Debuggear sistema de permisos

## 🧪 Testing con Postman

Incluye colección completa de Postman:
- `CRM-GEMS-API.postman_collection.json`
- Todas las rutas documentadas
- Variables de entorno configuradas
- Tests automatizados

## 🚦 Estados de Respuesta

### Códigos HTTP
- `200` - OK
- `201` - Creado
- `400` - Error de validación
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `500` - Error interno

### Estructura de Respuesta
```javascript
// Éxito
{
  "success": true,
  "data": {...},
  "message": "Operación exitosa"
}

// Error
{
  "success": false,
  "error": "Mensaje de error",
  "details": {...}
}
```

## 🔗 Integración con Frontend

Compatible con:
- Vue.js 3 + TypeScript
- Axios para peticiones HTTP
- Pinia para gestión de estado
- JWT para autenticación

## 🏃‍♂️ Comandos Disponibles

```bash
npm start          # Iniciar servidor
npm run dev        # Desarrollo con nodemon
npm test           # Ejecutar tests
npm run seed       # Poblar base de datos
```

## 📋 TODO / Roadmap

- [ ] Tests unitarios con Jest
- [ ] Rate limiting
- [ ] Logging con Winston
- [ ] Documentación con Swagger
- [ ] Websockets para tiempo real
- [ ] Sistema de notificaciones push

## 🤝 Contribución

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto es privado y pertenece a GEMS Innovations.

## 👨‍💻 Autor

**Sebastián Pulgarín**
- Email: sebastian.pulgarin@s1-inconcertcc.com
- GitHub: [@sebastianpg12](https://github.com/sebastianpg12)

---

> 💡 **Nota**: Este backend está optimizado para trabajar con el frontend de GEMS CRM desarrollado en Vue.js 3 + TypeScript.

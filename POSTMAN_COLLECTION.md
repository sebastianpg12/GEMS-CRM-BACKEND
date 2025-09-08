# Colección Postman - CRM GEMS Backend API

Esta colección de Postman contiene todos los endpoints disponibles en el backend del CRM GEMS para realizar operaciones CRUD completas.

## Configuración Base
- **URL Base**: `http://localhost:4000/api`
- **Content-Type**: `application/json`

## Variables de Entorno Recomendadas
```json
{
  "baseUrl": "http://localhost:4000/api",
  "clientId": "",
  "activityId": "",
  "paymentId": "",
  "followupId": "",
  "issueId": "",
  "notificationId": "",
  "docId": "",
  "minuteId": "",
  "settingId": "",
  "teamId": ""
}
```

---

## 📋 Colección JSON para Importar en Postman

```json
{
  "info": {
    "name": "CRM GEMS Backend API",
    "description": "Colección completa de endpoints para el backend CRM GEMS",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:4000/api"
    }
  ],
  "item": [
    {
      "name": "👥 Clientes",
      "item": [
        {
          "name": "Obtener todos los clientes",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/clients",
              "host": ["{{baseUrl}}"],
              "path": ["clients"]
            }
          }
        },
        {
          "name": "Crear cliente",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Juan Pérez\",\n  \"email\": \"juan.perez@email.com\",\n  \"phone\": \"+57 300 123 4567\",\n  \"company\": \"Empresa ABC\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/clients",
              "host": ["{{baseUrl}}"],
              "path": ["clients"]
            }
          }
        },
        {
          "name": "Actualizar cliente",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Juan Pérez Actualizado\",\n  \"email\": \"juan.perez.actualizado@email.com\",\n  \"phone\": \"+57 300 987 6543\",\n  \"company\": \"Nueva Empresa XYZ\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/clients/{{clientId}}",
              "host": ["{{baseUrl}}"],
              "path": ["clients", "{{clientId}}"]
            }
          }
        },
        {
          "name": "Eliminar cliente",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/clients/{{clientId}}",
              "host": ["{{baseUrl}}"],
              "path": ["clients", "{{clientId}}"]
            }
          }
        }
      ]
    },
    {
      "name": "📋 Actividades",
      "item": [
        {
          "name": "Obtener todas las actividades",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/activities",
              "host": ["{{baseUrl}}"],
              "path": ["activities"]
            }
          }
        },
        {
          "name": "Crear actividad",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Reunión de seguimiento\",\n  \"description\": \"Reunión para revisar el progreso del proyecto\",\n  \"date\": \"2024-12-15T10:00:00.000Z\",\n  \"status\": \"pending\",\n  \"clientId\": \"{{clientId}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/activities",
              "host": ["{{baseUrl}}"],
              "path": ["activities"]
            }
          }
        },
        {
          "name": "Actualizar actividad",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Reunión de seguimiento actualizada\",\n  \"description\": \"Reunión actualizada para revisar el progreso\",\n  \"date\": \"2024-12-16T14:00:00.000Z\",\n  \"status\": \"completed\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/activities/{{activityId}}",
              "host": ["{{baseUrl}}"],
              "path": ["activities", "{{activityId}}"]
            }
          }
        },
        {
          "name": "Eliminar actividad",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/activities/{{activityId}}",
              "host": ["{{baseUrl}}"],
              "path": ["activities", "{{activityId}}"]
            }
          }
        }
      ]
    },
    {
      "name": "💰 Pagos",
      "item": [
        {
          "name": "Obtener todos los pagos",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/payments",
              "host": ["{{baseUrl}}"],
              "path": ["payments"]
            }
          }
        },
        {
          "name": "Crear pago",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"amount\": 1500000,\n  \"dueDate\": \"2024-12-30T00:00:00.000Z\",\n  \"status\": \"pending\",\n  \"clientId\": \"{{clientId}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/payments",
              "host": ["{{baseUrl}}"],
              "path": ["payments"]
            }
          }
        },
        {
          "name": "Actualizar pago",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"amount\": 1800000,\n  \"dueDate\": \"2024-12-31T00:00:00.000Z\",\n  \"status\": \"paid\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/payments/{{paymentId}}",
              "host": ["{{baseUrl}}"],
              "path": ["payments", "{{paymentId}}"]
            }
          }
        },
        {
          "name": "Eliminar pago",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/payments/{{paymentId}}",
              "host": ["{{baseUrl}}"],
              "path": ["payments", "{{paymentId}}"]
            }
          }
        }
      ]
    },
    {
      "name": "📞 Seguimientos",
      "item": [
        {
          "name": "Obtener todos los seguimientos",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/followups",
              "host": ["{{baseUrl}}"],
              "path": ["followups"]
            }
          }
        },
        {
          "name": "Crear seguimiento",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"type\": \"call\",\n  \"notes\": \"Llamada de seguimiento para revisar propuesta\",\n  \"date\": \"2024-12-10T15:30:00.000Z\",\n  \"status\": \"pending\",\n  \"clientId\": \"{{clientId}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/followups",
              "host": ["{{baseUrl}}"],
              "path": ["followups"]
            }
          }
        },
        {
          "name": "Actualizar seguimiento",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"type\": \"email\",\n  \"notes\": \"Seguimiento actualizado por email\",\n  \"status\": \"completed\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/followups/{{followupId}}",
              "host": ["{{baseUrl}}"],
              "path": ["followups", "{{followupId}}"]
            }
          }
        },
        {
          "name": "Eliminar seguimiento",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/followups/{{followupId}}",
              "host": ["{{baseUrl}}"],
              "path": ["followups", "{{followupId}}"]
            }
          }
        }
      ]
    },
    {
      "name": "🚨 Issues",
      "item": [
        {
          "name": "Obtener todos los issues",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/issues",
              "host": ["{{baseUrl}}"],
              "path": ["issues"]
            }
          }
        },
        {
          "name": "Crear issue",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Problema con el sistema de facturación\",\n  \"description\": \"El cliente reporta errores en la generación de facturas\",\n  \"priority\": \"high\",\n  \"status\": \"open\",\n  \"clientId\": \"{{clientId}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/issues",
              "host": ["{{baseUrl}}"],
              "path": ["issues"]
            }
          }
        },
        {
          "name": "Actualizar issue",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Issue actualizado\",\n  \"description\": \"Descripción actualizada del problema\",\n  \"priority\": \"medium\",\n  \"status\": \"in-progress\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/issues/{{issueId}}",
              "host": ["{{baseUrl}}"],
              "path": ["issues", "{{issueId}}"]
            }
          }
        },
        {
          "name": "Eliminar issue",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/issues/{{issueId}}",
              "host": ["{{baseUrl}}"],
              "path": ["issues", "{{issueId}}"]
            }
          }
        }
      ]
    },
    {
      "name": "🔔 Notificaciones",
      "item": [
        {
          "name": "Obtener todas las notificaciones",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/notifications",
              "host": ["{{baseUrl}}"],
              "path": ["notifications"]
            }
          }
        },
        {
          "name": "Crear notificación",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Recordatorio de pago\",\n  \"message\": \"Recordar al cliente sobre el pago pendiente\",\n  \"type\": \"payment_reminder\",\n  \"status\": \"unread\",\n  \"clientId\": \"{{clientId}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/notifications",
              "host": ["{{baseUrl}}"],
              "path": ["notifications"]
            }
          }
        },
        {
          "name": "Actualizar notificación",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"status\": \"read\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/notifications/{{notificationId}}",
              "host": ["{{baseUrl}}"],
              "path": ["notifications", "{{notificationId}}"]
            }
          }
        },
        {
          "name": "Eliminar notificación",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/notifications/{{notificationId}}",
              "host": ["{{baseUrl}}"],
              "path": ["notifications", "{{notificationId}}"]
            }
          }
        }
      ]
    },
    {
      "name": "📄 Documentos",
      "item": [
        {
          "name": "Obtener todos los documentos",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/docs",
              "host": ["{{baseUrl}}"],
              "path": ["docs"]
            }
          }
        },
        {
          "name": "Crear documento",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Contrato de servicios\",\n  \"type\": \"contract\",\n  \"url\": \"https://example.com/document.pdf\",\n  \"status\": \"active\",\n  \"clientId\": \"{{clientId}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/docs",
              "host": ["{{baseUrl}}"],
              "path": ["docs"]
            }
          }
        },
        {
          "name": "Actualizar documento",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Contrato actualizado\",\n  \"status\": \"expired\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/docs/{{docId}}",
              "host": ["{{baseUrl}}"],
              "path": ["docs", "{{docId}}"]
            }
          }
        },
        {
          "name": "Eliminar documento",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/docs/{{docId}}",
              "host": ["{{baseUrl}}"],
              "path": ["docs", "{{docId}}"]
            }
          }
        }
      ]
    },
    {
      "name": "📝 Minutas",
      "item": [
        {
          "name": "Obtener todas las minutas",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/minutes",
              "host": ["{{baseUrl}}"],
              "path": ["minutes"]
            }
          }
        },
        {
          "name": "Crear minuta",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Reunión de kickoff del proyecto\",\n  \"content\": \"Se discutieron los objetivos del proyecto, tiempos de entrega y recursos necesarios\",\n  \"date\": \"2024-12-05T09:00:00.000Z\",\n  \"attendees\": [\"Juan Pérez\", \"María García\", \"Carlos López\"],\n  \"clientId\": \"{{clientId}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/minutes",
              "host": ["{{baseUrl}}"],
              "path": ["minutes"]
            }
          }
        },
        {
          "name": "Actualizar minuta",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Reunión actualizada\",\n  \"content\": \"Contenido actualizado de la reunión\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/minutes/{{minuteId}}",
              "host": ["{{baseUrl}}"],
              "path": ["minutes", "{{minuteId}}"]
            }
          }
        },
        {
          "name": "Eliminar minuta",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/minutes/{{minuteId}}",
              "host": ["{{baseUrl}}"],
              "path": ["minutes", "{{minuteId}}"]
            }
          }
        }
      ]
    },
    {
      "name": "⚙️ Configuraciones",
      "item": [
        {
          "name": "Obtener todas las configuraciones",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/settings",
              "host": ["{{baseUrl}}"],
              "path": ["settings"]
            }
          }
        },
        {
          "name": "Crear configuración",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"key\": \"company_name\",\n  \"value\": \"GEMS Innovations\",\n  \"description\": \"Nombre de la empresa\",\n  \"type\": \"string\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/settings",
              "host": ["{{baseUrl}}"],
              "path": ["settings"]
            }
          }
        },
        {
          "name": "Actualizar configuración",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"value\": \"GEMS Innovations S.A.S\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/settings/{{settingId}}",
              "host": ["{{baseUrl}}"],
              "path": ["settings", "{{settingId}}"]
            }
          }
        },
        {
          "name": "Eliminar configuración",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/settings/{{settingId}}",
              "host": ["{{baseUrl}}"],
              "path": ["settings", "{{settingId}}"]
            }
          }
        }
      ]
    },
    {
      "name": "👥 Equipo",
      "item": [
        {
          "name": "Obtener todos los miembros del equipo",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/team",
              "host": ["{{baseUrl}}"],
              "path": ["team"]
            }
          }
        },
        {
          "name": "Crear miembro del equipo",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Ana García\",\n  \"email\": \"ana.garcia@gems.com\",\n  \"role\": \"Developer\",\n  \"department\": \"IT\",\n  \"isActive\": true\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/team",
              "host": ["{{baseUrl}}"],
              "path": ["team"]
            }
          }
        },
        {
          "name": "Actualizar miembro del equipo",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"role\": \"Senior Developer\",\n  \"department\": \"Technology\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/team/{{teamId}}",
              "host": ["{{baseUrl}}"],
              "path": ["team", "{{teamId}}"]
            }
          }
        },
        {
          "name": "Eliminar miembro del equipo",
          "request": {
            "method": "DELETE",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/team/{{teamId}}",
              "host": ["{{baseUrl}}"],
              "path": ["team", "{{teamId}}"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🚀 Instrucciones de Uso

### 1. Importar la Colección
1. Abre Postman
2. Haz clic en "Import" en la esquina superior izquierda
3. Copia y pega el JSON de la colección anterior
4. Haz clic en "Import"

### 2. Configurar Variables de Entorno
1. Crea un nuevo environment llamado "CRM GEMS Local"
2. Añade las siguientes variables:
   - `baseUrl`: `http://localhost:4000/api`
   - `clientId`: (se llenará automáticamente al crear un cliente)
   - `activityId`: (se llenará automáticamente al crear una actividad)
   - Y así sucesivamente para cada entidad

### 3. Flujo de Pruebas Recomendado

#### Paso 1: Crear un Cliente
```json
POST {{baseUrl}}/clients
{
  "name": "Cliente de Prueba",
  "email": "prueba@email.com",
  "phone": "+57 300 123 4567",
  "company": "Empresa Test"
}
```
*Guarda el `_id` del cliente creado en la variable `clientId`*

#### Paso 2: Crear una Actividad
```json
POST {{baseUrl}}/activities
{
  "title": "Primera actividad",
  "description": "Descripción de la actividad",
  "date": "2024-12-15T10:00:00.000Z",
  "status": "pending",
  "clientId": "{{clientId}}"
}
```

#### Paso 3: Crear un Pago
```json
POST {{baseUrl}}/payments
{
  "amount": 1000000,
  "dueDate": "2024-12-31T00:00:00.000Z",
  "status": "pending",
  "clientId": "{{clientId}}"
}
```

### 4. Códigos de Respuesta Esperados
- `200 OK`: Operación exitosa (GET, PUT)
- `201 Created`: Recurso creado exitosamente (POST)
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

### 5. Estructura de Respuestas

#### Respuesta Exitosa (GET)
```json
[
  {
    "_id": "ObjectId",
    "name": "Cliente Ejemplo",
    "email": "ejemplo@email.com",
    "createdAt": "2024-12-01T00:00:00.000Z"
  }
]
```

#### Respuesta Exitosa (DELETE)
```json
{
  "success": true
}
```

---

## 📝 Notas Adicionales

1. **Base de Datos**: Asegúrate de que MongoDB esté ejecutándose y la conexión esté configurada correctamente en el `.env`

2. **CORS**: El backend tiene CORS habilitado para todas las origins

3. **Populate**: Los endpoints GET incluyen automáticamente la información del cliente relacionado cuando aplica

4. **Validaciones**: Los campos requeridos están definidos en los modelos de Mongoose

5. **IDs**: Todos los IDs son ObjectIds de MongoDB de 24 caracteres hexadecimales

6. **Fechas**: Usar formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ) para todas las fechas

---

## 🛠️ Comandos Útiles

### Iniciar el Backend
```bash
cd back-crm-gems
npm start
```

### Verificar Conexión
```bash
curl http://localhost:4000/api/clients
```

---

¡La colección está lista para usar! 🎉

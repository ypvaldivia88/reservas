# Sistema de Autenticación y Registro

Este documento describe el sistema de autenticación y registro implementado en la aplicación de reservas.

## Roles de Usuario

### 1. Administrador (Admin)
- **Usuario por defecto:** `admin`
- **Contraseña por defecto:** `admin`
- Acceso completo al panel de administración
- Puede cambiar su contraseña
- Visualiza todas las reservas y clientes

### 2. Cliente
- Registro automático al hacer la primera reserva
- Identificación mediante nombre y teléfono
- No requiere autenticación para hacer reservas
- El teléfono es único por cliente

## Funcionalidades Implementadas

### Inicialización Automática del Admin
- Al iniciar la aplicación por primera vez, se crea automáticamente un usuario admin
- Credenciales por defecto: `admin` / `admin`
- Se recomienda cambiar la contraseña inmediatamente después del primer inicio de sesión

### Registro de Clientes
- Los clientes se registran automáticamente al hacer su primera reserva
- Campos requeridos: nombre y teléfono
- El teléfono debe ser único en el sistema
- Si un teléfono ya existe con un nombre diferente, se rechaza la reserva para prevenir duplicados

### Panel de Administración

#### Acceso
- URL: `/admin`
- Requiere credenciales de administrador
- Sesión válida por 24 horas

#### Dashboard (`/admin/dashboard`)
- Estadísticas:
  - Total de reservas
  - Total de clientes
  - Reservas pendientes
- Tabla de reservas con información detallada
- Lista de clientes registrados
- Opción para cambiar contraseña
- Cerrar sesión

## Endpoints de la API

### Autenticación

#### `POST /api/auth/login`
Inicia sesión como administrador.

**Request:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response exitosa:**
```json
{
  "success": true,
  "data": {
    "token": "session-token-value",
    "user": {
      "username": "admin",
      "role": "admin"
    }
  },
  "message": "Inicio de sesión exitoso"
}
```

#### `POST /api/auth/logout`
Cierra la sesión actual.

**Response:**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

#### `POST /api/auth/change-password`
Cambia la contraseña del administrador (requiere sesión activa).

**Request:**
```json
{
  "currentPassword": "admin",
  "newPassword": "nueva-contraseña-segura"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

#### `POST /api/auth/init`
Inicializa el usuario admin (llamado automáticamente al cargar la app).

**Response:**
```json
{
  "success": true,
  "message": "Admin creado exitosamente con usuario: admin y contraseña: admin"
}
```

### Clientes

#### `GET /api/clientes`
Obtiene la lista de todos los clientes registrados.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "nombre": "María García",
      "telefono": "+1 555 123 4567",
      "role": "cliente",
      "fechaCreacion": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### Reservas

#### `POST /api/reservas`
Crea una nueva reserva y registra al cliente si es nuevo.

**Comportamiento:**
1. Si el teléfono no existe: registra nuevo cliente y crea reserva
2. Si el teléfono existe con el mismo nombre: crea reserva
3. Si el teléfono existe con diferente nombre: rechaza la reserva

**Request:**
```json
{
  "nombre": "María García",
  "telefono": "+1 555 123 4567",
  "forma": "coffin",
  "largo": 5,
  "decoracion": "Francés con brillos"
}
```

## Seguridad

### Headers de Seguridad
El middleware configura los siguientes headers en todas las respuestas:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: origin-when-cross-origin`

### Protección de Rutas
- Las rutas `/admin/dashboard` requieren una sesión activa
- Las sesiones expiran después de 24 horas
- Las contraseñas se almacenan hasheadas usando bcrypt

### Validaciones
- Contraseña mínima: 4 caracteres (se recomienda aumentar en producción)
- Teléfono: formato validado con expresión regular
- Nombre: mínimo 2 caracteres

## Colecciones de MongoDB

### `users`
```javascript
{
  _id: ObjectId,
  nombre: String,
  telefono: String,      // Solo para clientes
  username: String,      // Solo para admin
  password: String,      // Solo para admin (hasheado)
  role: String,          // 'admin' | 'cliente'
  fechaCreacion: Date
}
```

### `sessions`
```javascript
{
  token: String,
  userId: ObjectId,
  username: String,
  role: String,
  createdAt: Date,
  expiresAt: Date
}
```

### `reservas`
```javascript
{
  _id: ObjectId,
  clienteId: String,     // Referencia al _id del cliente
  nombre: String,
  telefono: String,
  forma: String,
  largo: Number,
  decoracion: String,
  fechaCreacion: Date,
  estado: String         // 'pendiente' | 'confirmada' | 'cancelada' | 'completada'
}
```

## Mejoras Recomendadas para Producción

1. **Seguridad:**
   - Aumentar requisitos de contraseña (mínimo 8 caracteres, mayúsculas, números, símbolos)
   - Implementar rate limiting más robusto
   - Usar JWT con refresh tokens
   - Implementar autenticación de dos factores (2FA)

2. **Sesiones:**
   - Migrar a Redis para almacenamiento de sesiones
   - Implementar limpieza automática de sesiones expiradas

3. **Clientes:**
   - Agregar verificación de teléfono (SMS)
   - Permitir a clientes ver su historial de reservas
   - Implementar notificaciones por SMS/email

4. **Administración:**
   - Agregar roles adicionales (recepcionista, técnico, etc.)
   - Implementar permisos granulares
   - Dashboard con métricas avanzadas
   - Exportación de datos a CSV/Excel

## Flujo de Uso

### Para Clientes:
1. Acceder a `/reserva`
2. Completar el formulario con nombre, teléfono y preferencias
3. El sistema automáticamente:
   - Registra al cliente si es nuevo
   - Valida que no haya duplicados
   - Crea la reserva

### Para Administradores:
1. Acceder a `/admin`
2. Iniciar sesión con `admin` / `admin`
3. **Cambiar contraseña inmediatamente** (recomendado)
4. Desde el dashboard:
   - Ver todas las reservas
   - Consultar información de clientes
   - Gestionar el estado de las citas
5. Cerrar sesión al terminar

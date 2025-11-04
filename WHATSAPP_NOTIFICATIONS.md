# 📱 WhatsApp Notifications

## Descripción

Este sistema permite que los clientes notifiquen al administrador sobre nuevas reservas a través de WhatsApp de manera automática, enviando un mensaje desde su propia aplicación de WhatsApp.

## Cómo Funciona

### 1. Flujo de Reserva del Cliente

1. El cliente completa el formulario de reserva en `/reserva`
2. Al enviar exitosamente la reserva:
   - La reserva se guarda en la base de datos
   - Se abre automáticamente WhatsApp Web/App del cliente
   - El mensaje está pre-rellenado con todos los detalles de la reserva
   - El cliente solo necesita presionar "Enviar"

### 2. Contenido del Mensaje de WhatsApp

El mensaje incluye:
- 👤 Nombre del cliente
- 📞 Teléfono
- 📅 Fecha de la cita
- 🕐 Hora de la cita
- 💅 Forma de uñas
- 📏 Largo
- 🎨 Decoración (si se especificó)
- 🔗 **Link directo al panel de administración**

### 3. Acceso Directo desde WhatsApp

El link incluido en el mensaje WhatsApp tiene este formato:
```
https://tu-dominio.com/admin/dashboard?reserva={id}
```

Cuando el administrador hace clic en este link:
1. Se abre el panel de administración
2. La reserva se carga automáticamente en el modal de edición
3. Aparece un mensaje indicando que la reserva se abrió desde WhatsApp

### 4. Acciones Rápidas del Administrador

En el modal de edición, si la reserva está en estado "pendiente", el administrador puede:

- ✅ **Confirmar Reserva**: Cambia el estado a "confirmada" con un solo clic
- ❌ **Cancelar Reserva**: Cambia el estado a "cancelada" con un solo clic
- ✏️ **Editar Detalles**: Modificar cualquier campo de la reserva
- 🗑️ **Eliminar**: Eliminar la reserva completamente

## Configuración

### Número de WhatsApp del Administrador

El número del administrador se puede configurar de dos maneras:

1. **Variable de Entorno (Recomendado)**:
   ```bash
   # .env.local
   NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER="+5363233073"
   ```

2. **Valor por defecto en código** (`lib/whatsapp.ts`):
   ```typescript
   const adminPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || '+5363233073';
   ```

Si no se define la variable de entorno, se usará el valor por defecto `+5363233073`.

### Formato del Número

- Incluir el código de país con `+`
- Sin espacios ni caracteres especiales
- Ejemplo: `+5363233073`

### Archivo .env.example

Se incluye un archivo `.env.example` con todas las variables de entorno necesarias:
```bash
MONGODB_URI="mongodb+srv://usuario:password@cluster.mongodb.net/nailsalon"
NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER="+5363233073"
```

## Ventajas de Este Enfoque

1. **Sin costos adicionales**: No se requieren servicios de terceros como Twilio
2. **Verificación del cliente**: El mensaje viene directamente del WhatsApp del cliente
3. **Conversación directa**: El administrador puede responder directamente al cliente
4. **Experiencia fluida**: El cliente no necesita copiar y pegar información
5. **Acceso directo**: Link que lleva directamente a la reserva en el panel

## Panel de Administración - CRUD Completo

### Reservas

**Ver todas las reservas**
- Tabla con todas las reservas ordenadas por fecha de creación
- Información visible: Cliente, Teléfono, Forma, Largo, Estado, Fecha/Hora de cita

**Editar reserva**
- Click en "✏️ Editar"
- Modal con todos los campos editables
- Cambio de estado (Pendiente, Confirmada, Cancelada, Completada)
- Botones de acción rápida para confirmar/cancelar

**Eliminar reserva**
- Click en "🗑️ Eliminar"
- Modal de confirmación
- Eliminación permanente

### Clientes

**Ver todos los clientes**
- Tabla con todos los clientes registrados
- Información visible: Nombre, Teléfono, Fecha de Registro

**Crear cliente**
- Click en "➕ Nuevo Cliente"
- Modal con formulario de creación
- Validación de teléfono duplicado

**Editar cliente**
- Click en "✏️ Editar"
- Modal con campos editables
- Validación de teléfono duplicado

**Eliminar cliente**
- Click en "🗑️ Eliminar"
- Modal de confirmación
- No se puede eliminar un cliente con reservas activas

## Endpoints API

### Reservas

- `GET /api/reservas` - Listar todas las reservas
- `POST /api/reservas` - Crear nueva reserva (retorna ID para WhatsApp)
- `GET /api/reservas/[id]` - Obtener una reserva específica
- `PATCH /api/reservas/[id]` - Actualizar reserva
- `DELETE /api/reservas/[id]` - Eliminar reserva

### Clientes

- `GET /api/clientes` - Listar todos los clientes
- `POST /api/clientes` - Crear nuevo cliente manualmente
- `GET /api/clientes/[id]` - Obtener un cliente específico
- `PATCH /api/clientes/[id]` - Actualizar cliente
- `DELETE /api/clientes/[id]` - Eliminar cliente

## Validaciones

### Reservas
- No se permite eliminar si hay conflictos
- Validación de formato de teléfono
- Validación de fecha/hora
- Verificación de disponibilidad de horario

### Clientes
- No se puede eliminar un cliente con reservas activas (pendiente o confirmada)
- Validación de teléfono único
- Formato de teléfono válido

## Pruebas Manuales

Para probar el sistema:

1. **Crear una reserva**:
   - Ir a `/reserva`
   - Completar el formulario
   - Enviar
   - Verificar que se abre WhatsApp con el mensaje

2. **Acceder desde WhatsApp**:
   - Copiar el link del mensaje de WhatsApp
   - Pegarlo en el navegador (con sesión de admin activa)
   - Verificar que se abre el modal de edición

3. **Confirmar/Cancelar reserva**:
   - En el modal, hacer clic en "✅ Confirmar Reserva" o "❌ Cancelar Reserva"
   - Verificar que el estado cambia

4. **CRUD de clientes**:
   - Ir a `/admin/dashboard`
   - Probar crear, editar y eliminar clientes
   - Verificar validaciones

## Notas Técnicas

- El sistema usa `api.whatsapp.com` para mejor compatibilidad móvil y desktop
- Los mensajes están codificados en URL para caracteres especiales
- El estado de la reserva se detecta automáticamente para mostrar botones rápidos
- Las validaciones previenen conflictos de datos

# 🚀 Guía Rápida de Uso del Sistema de Calendario

## Para Administradores

### 🔐 Acceso al Panel
1. Ir a `/admin`
2. Login con credenciales (usuario: `admin`, contraseña: `admin`)
3. Cambiar contraseña en el primer acceso

### 📅 Gestión de Horarios

#### Activar/Desactivar Días
1. Ir a "Horarios" en el menú de navegación
2. Ubicar el día que deseas modificar
3. Hacer clic en el switch (ON/OFF)
   - Verde = Día hábil activo
   - Gris = Día no hábil
4. Los cambios se guardan automáticamente

#### Modificar Horarios de un Día
1. En la tabla de horarios, ubicar el día
2. Hacer clic en "✏️ Editar Horarios"
3. Aparece un campo de texto con los horarios actuales
4. Modificar los horarios:
   - Formato: `HH:mm` (24 horas)
   - Separar con comas
   - Ejemplo: `08:30, 10:30, 14:00, 16:00`
5. Hacer clic en "Guardar"
6. Verificar el mensaje de confirmación

#### Horario Por Defecto
```
Días: Martes a Sábado
Slots: 
  - 08:30 (8:30 AM)
  - 10:30 (10:30 AM)
  - 14:00 (2:00 PM)
  - 16:00 (4:00 PM)

Total: 4 turnos por día
Almuerzo: 12:30 PM - 2:00 PM (respetado)
```

### 📊 Ver Reservas
1. Ir a "Dashboard" en el menú de navegación
2. Ver estadísticas:
   - Total de reservas
   - Total de clientes
   - Reservas pendientes
3. Ver tabla con todas las reservas
4. Filtrar y buscar según necesidad

## Para Clientes

### 📝 Hacer una Reserva

#### Paso 1: Información Personal
1. Ir a la página de reservas
2. Completar:
   - Nombre completo
   - Teléfono de contacto

#### Paso 2: Seleccionar Fecha y Hora
1. Ver el calendario mensual
2. Identificar días disponibles (resaltados en verde)
3. Hacer clic en un día disponible
4. Ver los horarios disponibles que aparecen abajo
5. Seleccionar un horario
6. Verificar que la fecha y hora estén seleccionadas

#### Paso 3: Preferencias de Diseño
1. Seleccionar forma de uñas (Coffin, Almond, Stiletto, Square)
2. Seleccionar largo (1-8)
3. Opcionalmente, describir decoración especial

#### Paso 4: Confirmar
1. Verificar todos los datos
2. Hacer clic en "✨ Confirmar Reserva"
3. Esperar confirmación
4. Anotar tu turno

### 🗓️ Leyenda del Calendario
- 🟢 **Verde**: Días disponibles (tienen horarios libres)
- 🔵 **Azul**: Fecha seleccionada actualmente
- ⚪ **Gris**: Días no disponibles (cerrado o sin horarios)
- 🔷 **Borde azul**: Día de hoy

### ⏰ Horarios
- Los horarios mostrados son únicamente los disponibles
- Si un horario no aparece, significa que ya está reservado
- La disponibilidad se actualiza en tiempo real

## Preguntas Frecuentes

### ¿Puedo reservar para hoy?
Sí, siempre que haya horarios disponibles y no hayan pasado.

### ¿Puedo cambiar mi reserva?
Contacta al salón para modificar o cancelar tu reserva.

### ¿Qué pasa si el horario que quiero no está disponible?
Intenta con otro día u horario. Los horarios se actualizan en tiempo real.

### ¿Cómo sé si mi reserva fue confirmada?
Verás un mensaje de confirmación verde después de enviar el formulario.

### ¿El salón está cerrado los domingos y lunes?
Por defecto sí. El administrador puede cambiar esto si es necesario.

## Tips y Mejores Prácticas

### Para Administradores
- ✅ Revisa y actualiza los horarios regularmente
- ✅ Desactiva días feriados con anticipación
- ✅ Mantén al menos 3-4 slots por día para mejor flujo
- ✅ Respeta el tiempo de almuerzo (12:30-2:00 PM)
- ✅ Verifica las reservas pendientes diariamente

### Para Clientes
- ✅ Reserva con anticipación cuando sea posible
- ✅ Verifica bien la fecha y hora antes de confirmar
- ✅ Ten en cuenta el tiempo de duración (60-90 min)
- ✅ Llega 5-10 minutos antes de tu cita
- ✅ Si necesitas cancelar, hazlo con 24h de anticipación

## 🆘 Solución de Problemas

### "No hay horarios disponibles"
**Posibles causas:**
- El día no es hábil
- Todos los horarios están reservados
- El día está en el pasado

**Solución:**
- Intenta con otra fecha
- Contacta al salón por teléfono

### "Este horario ya está reservado"
**Causa:**
- Otro cliente reservó justo antes que tú

**Solución:**
- Selecciona otro horario disponible
- Refresca la página para ver disponibilidad actualizada

### El calendario no carga
**Posibles causas:**
- Problema de conexión
- Error del servidor

**Solución:**
- Refresca la página (F5)
- Verifica tu conexión a internet
- Intenta en unos minutos

### No puedo editar los horarios (Admin)
**Posibles causas:**
- El día no está activado
- No estás logueado como admin

**Solución:**
- Activa el día primero con el switch
- Verifica tu sesión de admin

## 📞 Soporte

Si encuentras algún problema no listado aquí:
1. Verifica tu conexión a internet
2. Refresca la página
3. Intenta cerrar sesión y volver a entrar
4. Si el problema persiste, contacta al soporte técnico

## 🎯 Comandos Rápidos (Desarrolladores)

### Desarrollo
```bash
npm run dev          # Iniciar servidor de desarrollo
npm run lint         # Verificar código
npm run type-check   # Verificar tipos TypeScript
```

### Testing
```bash
node /tmp/test-calendar-system.js  # Test de lógica del calendario
```

### Base de Datos
```javascript
// Crear horario por defecto manualmente (MongoDB)
db.schedules.insertOne({
  name: "default",
  description: "Horario por defecto",
  schedule: [/* ... */],
  createdAt: new Date(),
  updatedAt: new Date()
});
```

---

**Versión:** 1.0  
**Última actualización:** Noviembre 2025  
**Sistema:** Reservas Nail Salon

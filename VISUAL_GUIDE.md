# 📸 Guía Visual del Sistema de Calendario

## 🎨 Estructura Visual de la Interfaz

### 1. Formulario de Reserva del Cliente (ReservaForm)

```
┌─────────────────────────────────────────────────────────────┐
│                 Completa tu Reserva                          │
│           Cuéntanos qué diseño tienes en mente              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📝 Información Personal                                      │
│                                                              │
│  Nombre Completo *          Teléfono de Contacto *          │
│  [👤 _____________]          [📞 _____________]              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📅 Fecha y Hora de tu Cita                                  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           ← Noviembre 2025 →                          │  │
│  │                                                        │  │
│  │  Dom  Lun  Mar  Mié  Jue  Vie  Sáb                   │  │
│  │   1    2   [3]  [4]  [5]  [6]  [7]                   │  │
│  │  [8]   9   10   11   12   13   14                     │  │
│  │  15   16   17   18   19   20   21                     │  │
│  │  22   23   24   25   26   27   28                     │  │
│  │  29   30                                               │  │
│  │                                                        │  │
│  │  [3] = Fecha disponible (verde)                       │  │
│  │  Fecha seleccionada = (azul)                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Horarios disponibles para Martes, 3 de noviembre de 2025:  │
│  [08:30]  [10:30]  [14:00]  [16:00]                         │
│                                                              │
│  Leyenda:                                                    │
│  🟢 Días disponibles                                         │
│  🔵 Fecha seleccionada                                       │
│  ⚪ No disponible                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 💅 Preferencias de Diseño                                   │
│                                                              │
│  Forma de Uñas *                                            │
│  [✨ Selecciona tu forma favorita ▼]                        │
│                                                              │
│  Largo Deseado *                                            │
│  [1] [2] [3] [4] [5] [6] [7] [8]                           │
│                                                              │
│  Decoración Especial (Opcional)                             │
│  [🎨 __________________________________]                     │
└─────────────────────────────────────────────────────────────┘

                    [✨ Confirmar Reserva]
```

### 2. Panel de Admin - Horarios (/admin/schedule)

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Gestión de Horarios               🚪 Cerrar Sesión      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [📊 Dashboard]    [📅 Horarios]                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📋 Información                                               │
│ • Activa/desactiva días hábiles con el interruptor          │
│ • Haz clic en "Editar Horarios" para personalizar           │
│ • Los horarios deben estar en formato 24h (HH:mm)           │
│ • Separa múltiples horarios con comas                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Horario Semanal                                             │
│                                                              │
│ ┌──────┬────────┬──────────────────────┬──────────────────┐ │
│ │ Día  │ Estado │ Horarios Disponibles │ Acciones         │ │
│ ├──────┼────────┼──────────────────────┼──────────────────┤ │
│ │Lunes │ [OFF]  │ Sin horarios         │                  │ │
│ ├──────┼────────┼──────────────────────┼──────────────────┤ │
│ │Martes│ [ON]   │ 08:30 10:30 14:00    │ ✏️ Editar       │ │
│ │      │Activo  │ 16:00                │   Horarios       │ │
│ ├──────┼────────┼──────────────────────┼──────────────────┤ │
│ │Miér. │ [ON]   │ 08:30 10:30 14:00    │ ✏️ Editar       │ │
│ │      │Activo  │ 16:00                │   Horarios       │ │
│ ├──────┼────────┼──────────────────────┼──────────────────┤ │
│ │Jueves│ [ON]   │ 08:30 10:30 14:00    │ ✏️ Editar       │ │
│ │      │Activo  │ 16:00                │   Horarios       │ │
│ ├──────┼────────┼──────────────────────┼──────────────────┤ │
│ │Viern.│ [ON]   │ 08:30 10:30 14:00    │ ✏️ Editar       │ │
│ │      │Activo  │ 16:00                │   Horarios       │ │
│ ├──────┼────────┼──────────────────────┼──────────────────┤ │
│ │Sábado│ [ON]   │ 08:30 10:30 14:00    │ ✏️ Editar       │ │
│ │      │Activo  │ 16:00                │   Horarios       │ │
│ ├──────┼────────┼──────────────────────┼──────────────────┤ │
│ │Doming│ [OFF]  │ Sin horarios         │                  │ │
│ └──────┴────────┴──────────────────────┴──────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📌 Gestión de Fechas Especiales                             │
│                                                              │
│ Próximamente: Podrás configurar horarios especiales para    │
│ días específicos (feriados, eventos, etc.)                  │
│                                                              │
│     Esta funcionalidad estará disponible pronto             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Modo de Edición de Horarios

```
Cuando el admin hace clic en "Editar Horarios":

┌─────────────────────────────────────────────────────────────┐
│ │Martes│ [ON]   │ [08:30, 10:30, 14:00, 16:00___________] │ │
│ │      │Activo  │ [Guardar] [Cancelar]                     │ │
└─────────────────────────────────────────────────────────────┘

El admin puede:
- Modificar los horarios existentes
- Agregar nuevos horarios (separados por comas)
- Guardar o cancelar los cambios
```

### 4. Navegación de Administrador (AdminNav)

```
┌─────────────────────────────────────────────────────────────┐
│  [📊 Dashboard]    [📅 Horarios]                            │
└─────────────────────────────────────────────────────────────┘

Características:
- Resaltado de la página actual (fondo azul)
- Hover effects en las opciones no seleccionadas
- Iconos descriptivos para cada sección
```

## 🎨 Paleta de Colores y Estados

### Estados del Calendario:
- **Verde** (`bg-green-50`): Días disponibles con horarios libres
- **Azul** (`bg-blue-600`): Fecha seleccionada actualmente
- **Gris** (`bg-gray-50`): Días no disponibles o sin horarios
- **Borde Azul** (`ring-blue-400`): Día actual

### Estados de Horarios:
- **Verde claro**: Horario disponible (puede ser seleccionado)
- **Azul**: Horario seleccionado por el cliente
- **Gris**: Horario no disponible (ya reservado)

### Estados de Switches (Admin):
- **Verde** (`bg-green-600`): Día hábil activado
- **Gris** (`bg-gray-300`): Día no hábil desactivado

## 📱 Diseño Responsive

### Mobile (< 640px):
- Calendario en grid 7 columnas compacto
- Slots de tiempo en grid 2 columnas
- Formulario de una sola columna
- Navegación apilada

### Tablet (640px - 1024px):
- Formulario personal en grid 2 columnas
- Slots de tiempo en grid 3 columnas
- Tabla de horarios con scroll horizontal

### Desktop (> 1024px):
- Layout completo con todas las columnas visibles
- Slots de tiempo en grid 4 columnas
- Tabla de horarios completamente visible

## 🌙 Modo Oscuro

Todos los componentes soportan modo oscuro:
- Fondos: `dark:bg-gray-800`, `dark:bg-gray-900`
- Textos: `dark:text-white`, `dark:text-gray-300`
- Bordes: `dark:border-gray-600`, `dark:border-gray-700`
- Elementos interactivos mantienen contraste adecuado

## ⚡ Animaciones y Transiciones

### Transiciones CSS:
- `transition-colors`: Cambios de color suaves
- `transition-all`: Transformaciones combinadas
- `hover:-translate-y-1`: Efecto de elevación en hover
- `hover:shadow-lg`: Sombras dinámicas

### Estados de Carga:
- Spinner animado durante carga de disponibilidad
- Deshabilitación visual de botones durante submit
- Feedback inmediato en todas las acciones

## 🔄 Flujo de Interacción

### Cliente reservando:
1. Ve calendario → Días verdes son disponibles
2. Hace clic en día verde → Día se pone azul
3. Aparecen horarios abajo → Botones de horarios disponibles
4. Selecciona horario → Horario se marca en azul
5. Completa resto del formulario
6. Envía → Validación y confirmación

### Admin gestionando:
1. Navega a Horarios
2. Ve switch para cada día
3. Toggle switch → Activa/desactiva día
4. Clic "Editar Horarios" → Campo de texto aparece
5. Modifica horarios → Separa con comas
6. Guarda → Cambios se aplican inmediatamente
7. Ve confirmación visual

## ✨ Detalles de UX

### Feedback Visual:
- ✅ Iconos de éxito/error en mensajes
- 🎨 Colores semánticos (verde=éxito, rojo=error, azul=info)
- 💡 Tooltips y descripciones contextuales
- ⚠️ Validación en tiempo real con mensajes claros

### Accesibilidad:
- Labels descriptivos en todos los campos
- Contraste adecuado en modo claro y oscuro
- Estados hover/focus claramente diferenciados
- Mensajes de error legibles y ubicados cerca del campo

### Prevención de Errores:
- Deshabilitación de fechas pasadas
- Deshabilitación de días no laborables
- Validación antes de permitir submit
- Confirmación visual antes de acciones destructivas

---

Esta guía visual representa la implementación completa del sistema de calendario. 
Todos estos elementos están funcionalmente implementados y listos para uso.

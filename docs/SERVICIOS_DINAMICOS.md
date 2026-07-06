# 💅 Sistema de Gestión de Servicios - Documentación

## 📋 Resumen del Cambio

Se ha redefinido completamente el concepto de **Servicios** para convertir la sección hardcoded en un sistema dinámico y gestionable desde el panel de administración.

## ✨ Características Implementadas

### 1. **Componente Dinámico de Servicios** (`DynamicServicesSection.tsx`)
- Carga servicios activos desde la API
- Asocia automáticamente imágenes con servicios
- Muestra precio si está definido
- Gradiente por defecto si no hay imagen
- Loading state con spinner
- Se oculta si no hay servicios activos

### 2. **Página de Administración Mejorada** (`/admin/servicios`)
- ✅ CRUD completo de servicios
- 🖼️ **Selector visual de imágenes** con previews
- 📊 Vista en tarjetas con información completa
- 🎯 Estado activo/inactivo
- 🔢 Sistema de ordenamiento
- 💰 Campos de precio y duración
- 🚀 Banner de inicialización para nuevos usuarios

### 3. **Navegación Actualizada**
- Agregado enlace "💅 Servicios" en el menú de admin
- Fácil acceso entre secciones

### 4. **Endpoint de Inicialización** (`/api/servicios/init`)
- POST: Crea los 4 servicios por defecto
- GET: Verifica estado de inicialización
- Previene duplicados
- Servicios por defecto:
  1. Gel / Softgel
  2. Base Rubber / Gel Builder
  3. Gel Dipping
  4. Pedicure

## 🔄 Flujo de Uso

### Primera Vez (Sin Servicios):

1. **Accede a `/admin/servicios`**
   - Verás un banner de bienvenida con 2 opciones

2. **Opción A: Inicializar Servicios por Defecto**
   - Click en "🎯 Inicializar Servicios por Defecto"
   - Se crean los 4 servicios tradicionales
   - Luego puedes editar cada uno y asignar imágenes

3. **Opción B: Crear Servicios Personalizados**
   - Click en "➕ Crear Servicio Personalizado"
   - Define nombre, descripción, precio, duración
   - Selecciona imagen del pool disponible

### Asignar Imágenes a Servicios:

1. **Sube imágenes en `/admin/contenido`**
   - Usa nombres descriptivos (ej: "gel-softgel", "pedicure")

2. **Edita cada servicio**
   - Click en "Editar" en la tarjeta del servicio
   - En el modal, desplázate a "Imagen de Fondo"
   - Selecciona visualmente la imagen deseada
   - Click derecho: checkmark azul confirma selección

3. **Guarda cambios**

## 🎨 Estructura del Modelo Servicio

```typescript
{
  _id: string;
  nombre: string;              // Título del servicio
  descripcion: string;         // Descripción corta
  precio?: number;             // Precio opcional (se muestra si > 0)
  duracion?: number;           // Duración en minutos (futuro uso)
  imagenId?: string;           // ID de la imagen asociada
  activo: boolean;             // Mostrar/ocultar en página principal
  orden?: number;              // Orden de visualización
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

## 🔗 Relación con Imágenes

- El campo `imagenId` referencia a una imagen de `/api/imagenes`
- El componente dinámico resuelve automáticamente esta relación
- En el admin, selector visual muestra previews de todas las imágenes
- Si no hay `imagenId`, se muestra un gradiente por defecto

## 📍 Archivos Modificados/Creados

### Nuevos:
- ✅ `components/DynamicServicesSection.tsx` - Componente dinámico
- ✅ `app/api/servicios/init/route.ts` - Endpoint inicialización

### Modificados:
- ✅ `app/page.tsx` - Usa componente dinámico en lugar de hardcode
- ✅ `app/admin/servicios/page.tsx` - Selector visual + banner init
- ✅ `components/AdminNav.tsx` - Agregado enlace Servicios
- ✅ `app/admin/(protected)/contenido/page.tsx` - Bulk operations (cambio previo)

## 🎯 Ventajas del Nuevo Sistema

1. **Flexibilidad**: Agrega/elimina servicios sin tocar código
2. **Visual**: Selector de imágenes intuitivo con previews
3. **Escalable**: Fácil agregar nuevos campos (iconos, categorías, etc.)
4. **SEO-Friendly**: Servicios dinámicos con datos estructurados
5. **Mantenible**: Un solo lugar para gestionar servicios
6. **Precio dinámico**: Opcional mostrar precios en tarjetas

## 🚀 Próximos Pasos (Opcionales)

- [ ] Agregar campo `icono` emoji para los servicios
- [ ] Categorías de servicios (Manicure, Pedicure, Adicionales)
- [ ] Descripción larga con editor rich text
- [ ] Galería múltiple por servicio (carrusel)
- [ ] Sistema de reservas filtrado por servicio
- [ ] Estadísticas de servicios más solicitados

## 🐛 Notas Importantes

- **Imágenes**: Deben tener buena resolución (min 800x800px)
- **Descripción**: Mantener corta (max 100 caracteres) para mejor UX
- **Orden**: Número menor = aparece primero
- **Activo**: Solo servicios activos se muestran en la página principal
- **Precio**: Si es 0 o no definido, no se muestra en la tarjeta

## 📞 Soporte

Para dudas o mejoras, revisar el código en:
- Componente: `components/DynamicServicesSection.tsx`
- Admin: `app/admin/servicios/page.tsx`
- API: `app/api/servicios/route.ts`

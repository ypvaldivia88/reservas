# Sistema Unificado de Gestión de Contenido

## Descripción

Se ha refactorizado completamente la gestión de contenido en la administración, consolidando las 4 páginas separadas (Imágenes, Servicios, Categorías, Galería) en una sola interfaz unificada y moderna.

## Cambios Principales

### 1. Nueva Página Unificada (`/admin/contenido`)

Reemplaza las 4 páginas anteriores con una única interfaz que permite:

- **Vista en grid de todas las imágenes**: Thumbnails de todas las imágenes del servidor en una cuadrícula responsive
- **Subida de imágenes**: Modal simple para subir nuevas imágenes
- **Gestión completa de imágenes**: Editar, ver ampliadas, y eliminar
- **Asignación a galerías**: Checkboxes para asignar imágenes a:
  - "Nuestros Trabajos" (Dashboard)
  - "Galería de Inspiración" (Página de Reserva)
- **Filtros opcionales**: 
  - Por galería
  - Por categoría
  - Por servicio
- **Creación inline**: Botones rápidos para crear categorías y servicios sin salir de la pantalla
- **Metadatos**: Título y descripción para cada imagen

### 2. Estructura de Datos Actualizada

#### ImageData (Extendido)

```typescript
interface ImageData {
  _id?: string;
  nombre: string;              // Nombre del archivo
  titulo?: string;             // Título para mostrar en galerías
  descripcion?: string;        // Descripción
  base64Data: string;          
  mimeType: string;           
  size?: number;              
  
  // Asignación a galerías
  enGaleriaDashboard?: boolean;       // "Nuestros trabajos" en dashboard
  enGaleriaInspiracion?: boolean;     // "Galería de Inspiración" en reserva
  
  // Filtros opcionales (arrays para permitir múltiples asignaciones)
  categoriaIds?: string[];            // IDs de categorías asociadas
  servicioIds?: string[];             // IDs de servicios asociados
  
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}
```

### 3. Flujo de Trabajo

#### Subir una Imagen

1. Clic en "+ Nueva Imagen"
2. Seleccionar archivo (máx 5MB, JPEG/PNG/GIF/WebP)
3. Ingresar nombre del archivo (requerido)
4. Ingresar título para galerías (opcional)
5. Ingresar descripción (opcional)
6. Marcar galerías donde se mostrará:
   - ☑ Nuestros Trabajos (Dashboard)
   - ☑ Galería de Inspiración (Reserva)
7. Seleccionar categorías (opcional, múltiple)
8. Seleccionar servicios (opcional, múltiple)
9. Clic en "Subir Imagen"

#### Editar una Imagen

1. Clic en "Editar" en cualquier thumbnail
2. Modificar cualquier campo
3. Opcionalmente reemplazar la imagen
4. Guardar cambios

#### Ver Imagen Ampliada

1. Clic en el thumbnail de la imagen
2. Se abre modal con imagen a tamaño completo
3. Muestra título y descripción si están disponibles

#### Filtrar Imágenes

Use los selectores en la parte superior:
- **Galerías**: Todas / Nuestros Trabajos / Galería Inspiración
- **Categorías**: Todas / [categorías existentes]
- **Servicios**: Todos / [servicios existentes]

#### Crear Categoría/Servicio Rápidamente

1. Clic en "+ Categoría" o "+ Servicio"
2. Ingresar nombre (requerido)
3. Ingresar descripción (opcional para categorías, requerido para servicios)
4. Crear

### 4. Actualización de Galerías Frontend

#### DynamicGalleryCarousel (Dashboard - "Nuestros Trabajos")

Ahora usa directamente las imágenes con la flag `enGaleriaDashboard = true`:

```typescript
// Antes: Usaba GaleriaItem con referencias a imagenes
const galeria: GaleriaItem[] = [...];

// Ahora: Usa directamente ImageData con flag
const dashboardImages = imagenes.filter(img => img.enGaleriaDashboard);
```

#### DynamicInspirationGallery (Reserva - "Galería de Inspiración")

Ahora usa directamente las imágenes con la flag `enGaleriaInspiracion = true` y las agrupa por categorías:

```typescript
// Antes: Usaba GaleriaItem con categoriaId
const galeria: GaleriaItem[] = [...];

// Ahora: Usa ImageData con categoriaIds array
const inspirationImages = imagenes.filter(img => img.enGaleriaInspiracion);
const imagesByCategory = categorias.map(cat => ({
  categoria: cat,
  images: inspirationImages.filter(img => 
    img.categoriaIds && img.categoriaIds.includes(cat._id)
  )
}));
```

### 5. API Endpoints Actualizados

#### POST /api/imagenes

Campos nuevos aceptados:
- `titulo`: string (opcional)
- `enGaleriaDashboard`: boolean (default: false)
- `enGaleriaInspiracion`: boolean (default: false)
- `categoriaIds`: string[] (default: [])
- `servicioIds`: string[] (default: [])

#### PATCH /api/imagenes

Actualización parcial soportando los mismos campos nuevos.

#### GET /api/imagenes

Retorna todas las imágenes con los campos nuevos incluidos.

### 6. Navegación Actualizada

En el Dashboard de Admin (`/admin/dashboard`), el panel "Gestión de Contenido" ahora muestra:

```
┌─────────────────────────────────────────┐
│  🎨 Gestión Unificada de Contenido      │
│                                         │
│  Administra imágenes, galerías,        │
│  categorías y servicios en un solo     │
│  lugar                                  │
│                                    →    │
└─────────────────────────────────────────┘
```

En lugar de los 4 botones anteriores.

## Características

### Mobile First

- Grid responsive: 2 columnas en móvil, hasta 5 en desktop
- Modales optimizados para pantallas pequeñas
- Controles táctiles amigables
- Botones con tamaño mínimo de 44px

### Diseño Moderno

- Sin botones innecesarios
- Acciones contextuales
- Filtros simples y claros
- Modales limpios y focalizados

### Usabilidad

- Operaciones sin salir de la pantalla principal
- Filtrado en tiempo real
- Feedback visual inmediato
- Carga y procesamiento de imágenes optimizado

## Compatibilidad

### Páginas Antiguas

Las páginas antiguas (`/admin/imagenes`, `/admin/servicios`, `/admin/categorias`, `/admin/galeria`) siguen existiendo pero ya no están enlazadas desde el dashboard. Pueden ser removidas en el futuro si se confirma que no hay dependencias externas.

### Migración de Datos

No se requiere migración de datos. Las imágenes existentes:
- Tendrán `enGaleriaDashboard = false` y `enGaleriaInspiracion = false` por defecto
- Pueden ser editadas para asignarlas a las galerías
- Los arrays `categoriaIds` y `servicioIds` estarán vacíos inicialmente

### GaleriaItem (Deprecado)

El tipo `GaleriaItem` y la colección `galeria` en MongoDB ya no se utilizan en las galerías del frontend, pero se mantienen por compatibilidad. Las nuevas galerías usan directamente `ImageData` con flags.

## Beneficios

1. **Simplicidad**: Una sola interfaz para toda la gestión de contenido
2. **Eficiencia**: Operaciones más rápidas sin cambio de página
3. **Claridad**: Vista general de todas las imágenes y su asignación
4. **Flexibilidad**: Una imagen puede estar en ambas galerías simultáneamente
5. **Organización**: Filtros múltiples para encontrar imágenes rápidamente
6. **Escalabilidad**: Soporte para múltiples categorías y servicios por imagen

## Notas de Implementación

- Las imágenes siguen almacenándose en base64 en MongoDB
- La optimización automática (800x800px, 80% calidad) se mantiene
- Validación de tipos de archivo y tamaño se mantiene
- No se eliminan imágenes en uso
- Todas las operaciones son CRUD completas

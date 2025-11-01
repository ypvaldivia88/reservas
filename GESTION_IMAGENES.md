# Sistema de Gestión de Imágenes y Galerías

## Descripción

Este sistema permite al administrador gestionar imágenes, servicios, categorías y galerías para el salón de uñas. Las imágenes se almacenan en la base de datos MongoDB codificadas en base64 a una resolución optimizada.

## Características Implementadas

### 1. Gestión de Imágenes (`/admin/imagenes`)
- **Crear**: Subir nuevas imágenes desde el ordenador
- **Leer**: Ver todas las imágenes disponibles
- **Actualizar**: Modificar nombre, descripción o reemplazar imagen
- **Eliminar**: Eliminar imágenes (con validación de uso)

**Características especiales**:
- Redimensionamiento automático a máximo 800x800px
- Compresión con calidad del 80%
- Validación de tipos de archivo (JPEG, PNG, GIF, WebP)
- Validación de tamaño máximo (5MB)
- Almacenamiento en base64 en MongoDB
- Prevención de eliminación si la imagen está en uso

### 2. Gestión de Servicios (`/admin/servicios`)
- **Crear**: Añadir nuevos servicios con nombre, descripción, precio, duración
- **Leer**: Ver todos los servicios
- **Actualizar**: Modificar detalles del servicio
- **Eliminar**: Eliminar servicios

**Campos**:
- Nombre (requerido)
- Descripción (requerido)
- Precio (opcional)
- Duración en minutos (opcional)
- Imagen asociada (opcional, seleccionar de biblioteca)
- Estado activo/inactivo
- Orden de visualización

### 3. Gestión de Categorías (`/admin/categorias`)
- **Crear**: Añadir nuevas categorías
- **Leer**: Ver todas las categorías
- **Actualizar**: Modificar detalles
- **Eliminar**: Eliminar categorías (con validación de uso)

**Campos**:
- Nombre (requerido)
- Descripción (opcional)
- Imagen asociada (opcional)
- Estado activo/inactivo
- Orden de visualización

### 4. Gestión de Galería (`/admin/galeria`)
- **Crear**: Añadir nuevos items a la galería
- **Leer**: Ver todos los items
- **Actualizar**: Modificar detalles
- **Eliminar**: Eliminar items

**Campos**:
- Título (requerido)
- Descripción (opcional)
- Imagen (requerido, seleccionar de biblioteca)
- Categoría (opcional, vincular a una categoría)
- Servicio (opcional, vincular a un servicio)
- Destacado (marca para items especiales)
- Orden de visualización

## Estructura de Base de Datos

### Colección: `imagenes`
```javascript
{
  _id: ObjectId,
  nombre: String,
  descripcion: String,
  base64Data: String,  // Imagen codificada en base64
  mimeType: String,    // image/jpeg, image/png, etc.
  tamaño: Number,      // Tamaño en bytes
  fechaCreacion: Date,
  fechaActualizacion: Date
}
```

### Colección: `servicios`
```javascript
{
  _id: ObjectId,
  nombre: String,
  descripcion: String,
  precio: Number,
  duracion: Number,      // En minutos
  imagenId: String,      // Referencia a imagenes._id
  activo: Boolean,
  orden: Number,
  fechaCreacion: Date,
  fechaActualizacion: Date
}
```

### Colección: `categorias`
```javascript
{
  _id: ObjectId,
  nombre: String,
  descripcion: String,
  imagenId: String,      // Referencia a imagenes._id
  activo: Boolean,
  orden: Number,
  fechaCreacion: Date,
  fechaActualizacion: Date
}
```

### Colección: `galeria`
```javascript
{
  _id: ObjectId,
  titulo: String,
  descripcion: String,
  imagenId: String,      // Referencia a imagenes._id (requerido)
  categoriaId: String,   // Referencia a categorias._id (opcional)
  servicioId: String,    // Referencia a servicios._id (opcional)
  destacado: Boolean,
  orden: Number,
  fechaCreacion: Date,
  fechaActualizacion: Date
}
```

## API Endpoints

### Imágenes
- `GET /api/imagenes` - Obtener todas las imágenes
- `GET /api/imagenes?id={id}` - Obtener una imagen específica
- `POST /api/imagenes` - Crear nueva imagen
- `PATCH /api/imagenes` - Actualizar imagen existente
- `DELETE /api/imagenes?id={id}` - Eliminar imagen

### Servicios
- `GET /api/servicios` - Obtener todos los servicios
- `POST /api/servicios` - Crear nuevo servicio
- `PATCH /api/servicios` - Actualizar servicio
- `DELETE /api/servicios?id={id}` - Eliminar servicio

### Categorías
- `GET /api/categorias` - Obtener todas las categorías
- `POST /api/categorias` - Crear nueva categoría
- `PATCH /api/categorias` - Actualizar categoría
- `DELETE /api/categorias?id={id}` - Eliminar categoría

### Galería
- `GET /api/galeria` - Obtener todos los items de galería
- `POST /api/galeria` - Crear nuevo item
- `PATCH /api/galeria` - Actualizar item
- `DELETE /api/galeria?id={id}` - Eliminar item

## Utilidades de Imagen (lib/imageUtils.ts)

### Funciones Principales

1. **convertImageToBase64(file: File): Promise<string>**
   - Convierte un archivo de imagen a cadena base64

2. **resizeImage(file: File, maxWidth: 800, maxHeight: 800, quality: 0.8): Promise<Blob>**
   - Redimensiona imagen manteniendo aspect ratio
   - Comprime con calidad especificada

3. **preprocessImage(file: File): Promise<{base64Data, mimeType, tamaño}>**
   - Función completa: redimensiona, comprime y convierte a base64

4. **base64ToDataURL(base64Data: string, mimeType: string): string**
   - Convierte base64 a URL de datos para mostrar en etiquetas <img>

5. **isValidImageFile(file: File): boolean**
   - Valida tipo de archivo (JPEG, PNG, GIF, WebP)

6. **isValidFileSize(file: File, maxSizeMB: 5): boolean**
   - Valida tamaño máximo del archivo

## Navegación en el Panel de Administración

Desde el Dashboard (`/admin/dashboard`), el administrador puede acceder a:
- 🖼️ **Imágenes** → `/admin/imagenes`
- 💅 **Servicios** → `/admin/servicios`
- 📁 **Categorías** → `/admin/categorias`
- 🎨 **Galería** → `/admin/galeria`

## Características de Seguridad

1. **Validación de entrada**: Todos los endpoints validan datos requeridos
2. **Prevención de eliminación**: Imágenes y categorías no se pueden eliminar si están en uso
3. **Validación de archivos**: Solo se permiten tipos de imagen válidos
4. **Límite de tamaño**: Máximo 5MB por imagen
5. **Optimización automática**: Todas las imágenes se redimensionan automáticamente

## Flujo de Trabajo Típico

1. **Subir Imágenes**:
   - Ir a `/admin/imagenes`
   - Clic en "Nueva Imagen"
   - Seleccionar archivo, añadir nombre y descripción
   - La imagen se optimiza automáticamente y se guarda en base64

2. **Crear Servicio**:
   - Ir a `/admin/servicios`
   - Clic en "Nuevo Servicio"
   - Completar formulario
   - Seleccionar imagen de la biblioteca (opcional)

3. **Crear Categoría**:
   - Ir a `/admin/categorias`
   - Clic en "Nueva Categoría"
   - Completar formulario
   - Seleccionar imagen (opcional)

4. **Añadir a Galería**:
   - Ir a `/admin/galeria`
   - Clic en "Nuevo Item"
   - Seleccionar imagen de biblioteca (requerido)
   - Vincular a categoría o servicio (opcional)
   - Marcar como destacado si es necesario

## Ventajas del Sistema

1. **Sin dependencias externas**: No requiere servicios de terceros ni API keys
2. **Simple y directo**: Todo se almacena en MongoDB
3. **Optimización automática**: Las imágenes se redimensionan y comprimen
4. **Interfaz intuitiva**: UI moderna y fácil de usar
5. **Gestión completa**: CRUD completo para todos los recursos
6. **Relaciones flexibles**: Los items pueden vincularse entre sí

## Notas de Implementación

- Las imágenes se almacenan en base64 para evitar necesidad de almacenamiento externo
- La resolución se limita a 800x800px para mantener tamaños razonables en BD
- La calidad de compresión está fijada en 80% para balance entre calidad y tamaño
- Todas las fechas se registran automáticamente
- El sistema de orden permite personalizar la visualización en el frontend

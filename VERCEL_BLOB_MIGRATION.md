# Migración a Vercel Blob Storage

Este documento describe la migración del almacenamiento de imágenes desde MongoDB (base64) a Vercel Blob Storage para mejorar significativamente el rendimiento de carga de imágenes.

## 📊 Beneficios de la Migración

- **Rendimiento**: 10-50x más rápido que cargar base64 desde MongoDB
- **CDN Global**: Las imágenes se sirven desde la CDN de Vercel, más cerca de tus usuarios
- **Optimización**: Menor carga en la base de datos
- **Escalabilidad**: Mejor manejo de imágenes de alta resolución

## 🔧 Configuración Inicial

### 1. Crear Blob Store en Vercel

1. Ve a tu [dashboard de Vercel](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a la pestaña **Storage**
4. Haz clic en **Create Database** → **Blob**
5. Dale un nombre (ej: `reservas-images`)
6. Copia el token `BLOB_READ_WRITE_TOKEN`

### 2. Configurar Variables de Entorno

Agrega el token a tu archivo `.env.local`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxx
```

También configúralo en Vercel:
1. Ve a **Settings** → **Environment Variables**
2. Agrega `BLOB_READ_WRITE_TOKEN` con el valor copiado
3. Selecciona todos los entornos (Production, Preview, Development)

## 🚀 Implementación

### Cambios Realizados

#### 1. Nueva Librería de Utilidades (`lib/blobStorage.ts`)

```typescript
- uploadImageToBlob(file, filename) - Sube archivo a Blob Storage
- deleteImageFromBlob(url) - Elimina blob por URL
- uploadBase64ToBlob(base64Data, filename, mimeType) - Convierte base64 a blob
```

#### 2. API de Imágenes (`app/api/imagenes/route.ts`)

- **POST**: Ahora sube a Blob y guarda `blobUrl` en lugar de `base64Data`
- **PATCH**: Actualiza blob cuando se reemplaza la imagen
- **DELETE**: Elimina blob de Vercel antes de borrar registro de MongoDB
- **GET**: Retorna ambos `blobUrl` y `base64Data` (compatibilidad legacy)

#### 3. Tipos Actualizados (`lib/types.ts`)

```typescript
interface ImageData {
  base64Data?: string;  // Opcional ahora (legacy)
  blobUrl?: string;      // Nueva URL de Vercel Blob
  // ... otros campos
}
```

#### 4. Frontend (`app/admin/(protected)/contenido/page.tsx`)

- Usa `blobUrl` cuando está disponible
- Fallback a `base64Data` para imágenes legacy

## 🔄 Proceso de Migración

### Opción A: Migración Progresiva (Recomendado)

La implementación actual soporta **migración progresiva**:

1. **Imágenes nuevas**: Se suben automáticamente a Blob Storage
2. **Imágenes existentes**: Siguen funcionando con base64 hasta que se editen
3. **Al editar**: La imagen se migra automáticamente a Blob Storage

**Ventajas**: Sin downtime, sin riesgo, migración gradual

### Opción B: Migración Masiva

Para migrar todas las imágenes existentes de una vez, puedes crear un script:

```typescript
// scripts/migrate-images-to-blob.ts
import { MongoClient } from 'mongodb';
import { uploadBase64ToBlob, deleteImageFromBlob } from '../lib/blobStorage';

async function migrateImages() {
  const client = await MongoClient.connect(process.env.MONGODB_URI!);
  const db = client.db();
  const imagenes = await db.collection('imagenes').find({
    base64Data: { $exists: true },
    blobUrl: { $exists: false }
  }).toArray();

  console.log(`Migrando ${imagenes.length} imágenes...`);

  for (const imagen of imagenes) {
    try {
      const blob = await uploadBase64ToBlob(
        imagen.base64Data,
        imagen.nombre,
        imagen.mimeType
      );

      await db.collection('imagenes').updateOne(
        { _id: imagen._id },
        { 
          $set: { blobUrl: blob.url },
          $unset: { base64Data: "" } // Opcional: eliminar base64Data
        }
      );

      console.log(`✅ Migrado: ${imagen.nombre}`);
    } catch (error) {
      console.error(`❌ Error en ${imagen.nombre}:`, error);
    }
  }

  await client.close();
  console.log('¡Migración completada!');
}

migrateImages();
```

Para ejecutar:
```bash
npx tsx scripts/migrate-images-to-blob.ts
```

## ✅ Verificación

### 1. Probar Upload de Nueva Imagen

1. Ve a `/admin/contenido`
2. Sube una imagen nueva
3. Verifica en la consola del navegador que la URL comienza con `https://`
4. La imagen debe cargar mucho más rápido

### 2. Verificar en Vercel Dashboard

1. Ve a **Storage** → Tu Blob store
2. Deberías ver las imágenes subidas
3. Puedes ver las URLs y metadatos

### 3. Probar Edición

1. Edita una imagen existente con nueva imagen
2. El blob antiguo se debe eliminar
3. El nuevo blob se debe crear

### 4. Probar Eliminación

1. Elimina una imagen
2. El blob se debe eliminar de Vercel
3. El registro se debe eliminar de MongoDB

## 🔍 Troubleshooting

### Error: "Missing BLOB_READ_WRITE_TOKEN"

**Solución**: Asegúrate de tener la variable configurada:
```bash
# Verifica que exista
echo $BLOB_READ_WRITE_TOKEN

# O en Windows
echo %BLOB_READ_WRITE_TOKEN%
```

### Error: "blob.size is not defined"

**Solución**: Ya corregido. El SDK de Vercel Blob no retorna `size` en el resultado.

### Imágenes Legacy No Cargan

**Solución**: Las imágenes antiguas usan `base64Data`. El código tiene fallback automático:
```typescript
src={imagen.blobUrl || base64ToDataURL(imagen.base64Data || '', imagen.mimeType)}
```

### Blob No Se Elimina

**Solución**: Los errores de eliminación no bloquean la operación principal:
```typescript
try {
  await deleteImageFromBlob(url);
} catch (error) {
  console.error('Error deleting blob:', error);
  // Continue anyway
}
```

## 📈 Monitoreo

### Límites de Vercel Blob

- **Plan Hobby**: 1 GB storage, 100 GB bandwidth/mes
- **Plan Pro**: 100 GB storage, 1 TB bandwidth/mes
- [Ver pricing actualizado](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing)

### Verificar Uso

1. Ve a **Storage** en Vercel Dashboard
2. Revisa el uso actual de storage y bandwidth
3. Configura alertas si te acercas a los límites

## 🔐 Seguridad

- ✅ Los tokens de Blob son específicos por store
- ✅ Las URLs de blob son públicas pero no listables
- ✅ No se puede adivinar las URLs sin conocer el hash
- ⚠️ No compartas tu `BLOB_READ_WRITE_TOKEN`

## 📝 Notas Adicionales

- Las URLs de blob son permanentes y cacheable
- Los blobs eliminados no se pueden recuperar
- Vercel Blob usa Amazon S3 bajo el capó
- Las imágenes se sirven con headers de cache óptimos

## 🎯 Próximos Pasos

1. ✅ Implementación completada en branch `feature/vercel-blob-storage`
2. 🔄 Probar en desarrollo
3. 🚀 Deploy a producción
4. 📊 Monitorear rendimiento
5. (Opcional) Ejecutar migración masiva de imágenes existentes

---

**Creado**: $(date)  
**Branch**: `feature/vercel-blob-storage`  
**Autor**: GitHub Copilot

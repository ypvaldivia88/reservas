# Normalización de Teléfonos

## 📋 Problema Identificado

Los clientes ingresaban números de teléfono de diferentes formas:
- Con espacios: `5555 1234`
- Con código de país: `+53 5555 1234`
- Sin código de país: `55551234`
- Con guiones: `5555-1234`
- Con paréntesis: `(5555) 1234`

Esto causaba:
- ❌ **Duplicados**: El mismo cliente registrado múltiples veces
- ❌ **Búsqueda fallida**: No encontraba clientes existentes
- ❌ **Inconsistencia**: Datos en diferentes formatos

## ✅ Solución Implementada

### 1. Utilidades de Normalización (`lib/utils.ts`)

Se agregaron funciones para manejar teléfonos de forma consistente:

```typescript
phoneUtils = {
  // Normaliza eliminando espacios, agregando +53
  normalize(phone: string): string
  
  // Formatea para mostrar: +53 5555 5555
  format(phone: string): string
  
  // Valida formato cubano (8 dígitos)
  isValid(phone: string): boolean
  
  // Para comparaciones (sin + ni espacios)
  getComparisonKey(phone: string): string
}
```

### 2. Reglas de Normalización

Todos los teléfonos se guardan en formato estándar:
- **Formato**: `+53XXXXXXXX` (11 caracteres)
- **Ejemplo**: `+5355551234`
- **Automático**: Se agrega `+53` si no está presente

### 3. Validación Mejorada

**Antes:**
```typescript
// Aceptaba cualquier formato
/^\+?[\d\s\-()]{8,15}$/
```

**Ahora:**
```typescript
// Valida números cubanos específicamente
phoneUtils.isValid(phone) // Solo acepta 8 dígitos válidos
```

### 4. Experiencia de Usuario

#### En el formulario:
- ✅ Ayuda visual: `"Ej: 55551234 o +53 5555 1234"`
- ✅ Muestra cómo se guardará: `"Se guardará como: +53 5555 1234"`
- ✅ Permite escribir con espacios/guiones (se limpian automáticamente)
- ✅ Solo acepta caracteres válidos: números, +, espacios, guiones

#### Búsqueda de cliente:
- ✅ Encuentra al cliente sin importar cómo escriba el número
- ✅ `55551234` = `+53 5555 1234` = `5555-1234` (todos encuentran al mismo cliente)

### 5. Prevención de Duplicados

El sistema ahora:
1. Normaliza el teléfono ingresado
2. Busca en la base de datos con el formato normalizado
3. Si existe, carga los datos del cliente
4. Si no existe, permite registro nuevo

## 🔄 Migración de Datos Existentes

### Opción A: Usar el Endpoint API (Recomendado)

1. **Ejecutar migración**:
```bash
# Hacer una petición POST al endpoint
curl -X POST http://localhost:3000/api/admin/normalize-phones
```

2. **O desde el navegador**:
- Usar Postman, Thunder Client o similar
- POST a `http://localhost:3000/api/admin/normalize-phones`

3. **Revisar logs**:
El endpoint mostrará:
- ✅ Cuántos usuarios/reservas se actualizaron
- ⚠️ Posibles duplicados encontrados
- 📊 Estadísticas completas

### Opción B: Desde MongoDB Compass

```javascript
// En users collection
db.users.find({}).forEach(function(doc) {
  let phone = doc.telefono;
  let normalized = phone.replace(/[\s\-()]/g, '');
  
  if (!normalized.startsWith('+53')) {
    if (normalized.startsWith('53')) {
      normalized = '+' + normalized;
    } else if (normalized.length === 8) {
      normalized = '+53' + normalized;
    }
  }
  
  if (normalized !== doc.telefono) {
    db.users.updateOne(
      { _id: doc._id },
      { $set: { telefono: normalized } }
    );
    print(doc.nombre + ": " + doc.telefono + " → " + normalized);
  }
});

// Repetir para reservas collection
db.reservas.find({}).forEach(function(doc) {
  // ... mismo código
});
```

### ⚠️ IMPORTANTE: Después de Migrar

1. **Buscar duplicados**:
```javascript
db.users.aggregate([
  { $group: { 
      _id: '$telefono', 
      count: { $sum: 1 },
      nombres: { $push: '$nombre' }
  }},
  { $match: { count: { $gt: 1 } }}
]);
```

2. **Resolver duplicados manualmente**:
- Revisar cada caso
- Decidir qué registro mantener
- Fusionar datos si es necesario
- Eliminar duplicados

3. **Eliminar endpoint de migración**:
```bash
# Después de ejecutar una vez
rm app/api/admin/normalize-phones/route.ts
```

## 📊 Cambios en el Código

### Archivos Modificados:

1. **`lib/utils.ts`**
   - ✅ Agregado `phoneUtils` con normalización
   - ✅ Actualizado `validationUtils.isValidPhone()`

2. **`components/ReservaForm.tsx`**
   - ✅ Importado `phoneUtils`
   - ✅ Validación mejorada con `phoneUtils.isValid()`
   - ✅ Mensaje de ayuda visual con formato
   - ✅ Búsqueda de cliente normalizada

3. **`app/api/clientes/check-phone/route.ts`**
   - ✅ Normalización con `phoneUtils.normalize()`
   - ✅ Búsqueda consistente

4. **`app/api/reservas/route.ts`**
   - ✅ Validación con `phoneUtils.isValid()`
   - ✅ Guardado normalizado

### Archivos Nuevos:

5. **`scripts/normalize-phones.ts`**
   - 🆕 Script de migración
   - 🆕 Detección de duplicados

6. **`app/api/admin/normalize-phones/route.ts`**
   - 🆕 Endpoint temporal de migración
   - ⚠️ Eliminar después de usar

## 🧪 Testing

### Casos de Prueba:

```typescript
// Todos estos deben funcionar:
phoneUtils.normalize('55551234')       // → '+5355551234'
phoneUtils.normalize('+53 5555 1234')  // → '+5355551234'
phoneUtils.normalize('5555-1234')      // → '+5355551234'
phoneUtils.normalize('+5355551234')    // → '+5355551234'

// Formato visual:
phoneUtils.format('+5355551234')       // → '+53 5555 5555'

// Validación:
phoneUtils.isValid('55551234')         // → true
phoneUtils.isValid('+53 5555 1234')    // → true
phoneUtils.isValid('123')              // → false
phoneUtils.isValid('abcd1234')         // → false
```

### Probar en el Formulario:

1. Ingresar teléfono: `5555 1234`
2. Ver mensaje: "Se guardará como: +53 5555 1234"
3. Registrar cliente
4. Ingresar de nuevo: `+53 55551234`
5. Debe encontrar al mismo cliente ✅

## 📝 Notas para el Futuro

### Si necesitas cambiar el código de país:

En `lib/utils.ts`, modificar:
```typescript
// Cambiar de +53 (Cuba) a otro país
if (normalized.length === 8) {
  return '+XX' + normalized;  // XX = código del país
}
```

### Si necesitas diferentes longitudes:

Modificar validación en `phoneUtils.isValid()`:
```typescript
// Ejemplo: aceptar 10 dígitos
const phoneRegex = /^\+53\d{10}$/;
```

## ✅ Checklist de Implementación

- [x] Crear `phoneUtils` en `lib/utils.ts`
- [x] Actualizar validación en `ReservaForm.tsx`
- [x] Actualizar API `check-phone`
- [x] Actualizar API `reservas`
- [x] Crear script de migración
- [x] Crear endpoint de migración
- [ ] **PENDIENTE**: Ejecutar migración en producción
- [ ] **PENDIENTE**: Resolver duplicados encontrados
- [ ] **PENDIENTE**: Eliminar endpoint de migración

## 🆘 Solución de Problemas

### "No encuentra mi teléfono"
- Verificar que la migración se ejecutó
- Revisar en MongoDB el formato del teléfono guardado
- Debe ser: `+53XXXXXXXX`

### "Se creó duplicado"
- Ejecutar búsqueda de duplicados (ver arriba)
- Normalizar manualmente si es necesario
- Fusionar registros duplicados

### "Error de validación"
- Verificar que el número tiene 8 dígitos
- Solo números cubanos por ahora
- Formato: 5555XXXX

## 📧 Contacto

Si encuentras algún problema, revisa:
1. Los logs del servidor
2. La consola del navegador
3. Los datos en MongoDB Compass

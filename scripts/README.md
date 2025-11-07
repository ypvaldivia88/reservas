# Scripts de Utilidades

## 📱 normalize-phones.ts

Script para normalizar todos los números de teléfono en la base de datos al formato estándar `+53XXXXXXXX`.

### Uso

#### Opción 1: A través del API (Recomendado)

```bash
# Desde terminal
curl -X POST http://localhost:3000/api/admin/normalize-phones

# O usando la interfaz de administración
# Navegar a: http://localhost:3000/api/admin/normalize-phones
```

#### Opción 2: Importar directamente

```typescript
import { normalizePhones } from '@/scripts/normalize-phones';

await normalizePhones();
```

### ¿Qué hace?

1. ✅ Normaliza teléfonos en la colección `users`
2. ✅ Normaliza teléfonos en la colección `reservas`
3. ✅ Detecta y reporta duplicados
4. ✅ Muestra estadísticas de actualización

### Output Esperado

```
✅ Conectado a MongoDB

📱 Normalizando teléfonos en colección "users"...
  ✓ Usuario María García: 5555 1234 → +5355551234
  ✓ Usuario Juan Pérez: 53 55556789 → +5355556789
✅ 2 usuarios actualizados de 10 totales

📅 Normalizando teléfonos en colección "reservas"...
  ✓ Reserva Ana López: 5555-4321 → +5355554321
✅ 1 reservas actualizadas de 15 totales

🔍 Buscando posibles duplicados...
✅ No se encontraron duplicados

✨ Migración completada exitosamente
🔌 Conexión cerrada
```

### ⚠️ Importante

- **Ejecutar solo una vez** en cada base de datos
- **Hacer backup** antes de ejecutar
- **Revisar duplicados** reportados
- **Eliminar endpoint** después de usar (`app/api/admin/normalize-phones/`)

### Duplicados

Si se encuentran duplicados, el script los reportará:

```
⚠️  Se encontraron 2 teléfonos duplicados:
  📞 +5355551234:
     - María García (ID: 507f1f77bcf86cd799439011)
     - María G. (ID: 507f1f77bcf86cd799439012)
```

Deberás resolverlos manualmente:
1. Decidir qué registro mantener
2. Fusionar datos si es necesario  
3. Eliminar duplicados

### Ver en MongoDB

Después de ejecutar, verificar en MongoDB Compass:

```javascript
// Ver usuarios normalizados
db.users.find({ telefono: { $regex: /^\+53\d{8}$/ } })

// Ver usuarios sin normalizar
db.users.find({ telefono: { $not: { $regex: /^\+53\d{8}$/ } } })
```

## 🔐 Seguridad

El endpoint de migración **NO** está protegido. Opciones:

### Opción A: Eliminar después de usar
```bash
rm app/api/admin/normalize-phones/route.ts
```

### Opción B: Proteger con autenticación
```typescript
import { getServerSession } from "next-auth";

export async function POST() {
  const session = await getServerSession();
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  // ... resto del código
}
```

### Opción C: Variable de entorno
```typescript
export async function POST() {
  if (process.env.MIGRATION_TOKEN !== request.headers.get('x-migration-token')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  // ... resto del código
}
```

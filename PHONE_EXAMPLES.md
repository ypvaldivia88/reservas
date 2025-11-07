# 📱 Ejemplos de Uso - Validación de Teléfonos

## 🎯 Para Desarrolladores

### 1. Validar un Teléfono

```typescript
import { phoneUtils } from '@/lib/utils';

// Validación simple
const esValido = phoneUtils.isValid('55551234');
// → true

const esInvalido = phoneUtils.isValid('123');
// → false

// Ejemplos de números válidos
phoneUtils.isValid('55551234')        // ✅ true
phoneUtils.isValid('+53 5555 1234')   // ✅ true
phoneUtils.isValid('5555-1234')       // ✅ true
phoneUtils.isValid('+5355551234')     // ✅ true

// Ejemplos de números inválidos
phoneUtils.isValid('123')             // ❌ false
phoneUtils.isValid('abcd1234')        // ❌ false
phoneUtils.isValid('')                // ❌ false
phoneUtils.isValid('+1 555 1234')     // ❌ false (no es Cuba)
```

### 2. Normalizar un Teléfono

```typescript
import { phoneUtils } from '@/lib/utils';

// Diferentes formatos → mismo resultado
phoneUtils.normalize('55551234')
phoneUtils.normalize('5555 1234')
phoneUtils.normalize('+53 5555 1234')
phoneUtils.normalize('5555-1234')
phoneUtils.normalize('(5555) 1234')
phoneUtils.normalize('53 55551234')
// Todos retornan: '+5355551234'

// Uso práctico en un componente
const handlePhoneChange = (value: string) => {
  const normalized = phoneUtils.normalize(value);
  // Guardar en estado o enviar al servidor
  console.log(normalized); // '+5355551234'
};
```

### 3. Formatear para Mostrar

```typescript
import { phoneUtils } from '@/lib/utils';

// Formateo visual
const phone = '+5355551234';
const formatted = phoneUtils.format(phone);
// → '+53 5555 1234'

// Uso en componente
<p>Tu teléfono: {phoneUtils.format(cliente.telefono)}</p>
// Muestra: "Tu teléfono: +53 5555 1234"
```

### 4. Comparar Teléfonos

```typescript
import { phoneUtils } from '@/lib/utils';

// Para comparaciones
const phone1 = '+53 5555 1234';
const phone2 = '55551234';

const key1 = phoneUtils.getComparisonKey(phone1); // '5355551234'
const key2 = phoneUtils.getComparisonKey(phone2); // '5355551234'

if (key1 === key2) {
  console.log('Son el mismo número'); // ✅
}
```

## 🎨 Para UI/UX

### Ejemplo: Input con Validación en Tiempo Real

```typescript
'use client';

import { useState } from 'react';
import { phoneUtils } from '@/lib/utils';

export default function PhoneInput() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permitir solo caracteres válidos
    const cleaned = value.replace(/[^\d\s\-+()]/g, '');
    setPhone(cleaned);

    // Validar si tiene suficientes dígitos
    if (cleaned.length >= 8) {
      if (phoneUtils.isValid(cleaned)) {
        setError('');
      } else {
        setError('Ingresa un número cubano válido de 8 dígitos');
      }
    }
  };

  return (
    <div>
      <input
        type="tel"
        value={phone}
        onChange={handleChange}
        placeholder="Ej: 55551234"
        className={error ? 'border-red-500' : 'border-gray-300'}
      />
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      
      {!error && phone.length >= 8 && (
        <p className="text-green-500 text-sm">
          ✓ Se guardará como: {phoneUtils.format(phone)}
        </p>
      )}
    </div>
  );
}
```

### Ejemplo: Búsqueda de Cliente

```typescript
'use client';

import { useState } from 'react';
import { phoneUtils } from '@/lib/utils';

export default function ClientSearch() {
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [client, setClient] = useState(null);

  const searchClient = async () => {
    if (!phoneUtils.isValid(phone)) {
      alert('Número inválido');
      return;
    }

    setSearching(true);
    
    try {
      // El backend normalizará automáticamente
      const res = await fetch(
        `/api/clientes/check-phone?telefono=${encodeURIComponent(phone)}`
      );
      const data = await res.json();
      
      if (data.success && data.data.exists) {
        setClient(data.data.cliente);
      } else {
        alert('Cliente no encontrado');
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Buscar por teléfono..."
      />
      <button onClick={searchClient} disabled={searching}>
        {searching ? 'Buscando...' : 'Buscar'}
      </button>
      
      {client && (
        <div>
          <h3>Cliente encontrado:</h3>
          <p>Nombre: {client.nombre}</p>
          <p>Teléfono: {phoneUtils.format(client.telefono)}</p>
        </div>
      )}
    </div>
  );
}
```

## 🔧 Para Backend/API

### Ejemplo: Validación en API Route

```typescript
// app/api/ejemplo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { phoneUtils } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const { telefono, nombre } = await request.json();

  // 1. Validar formato
  if (!phoneUtils.isValid(telefono)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Número de teléfono inválido' 
      },
      { status: 400 }
    );
  }

  // 2. Normalizar antes de guardar
  const telefonoNormalizado = phoneUtils.normalize(telefono);

  // 3. Buscar duplicados
  const existente = await db.collection('users').findOne({
    telefono: telefonoNormalizado
  });

  if (existente) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Este teléfono ya está registrado' 
      },
      { status: 400 }
    );
  }

  // 4. Guardar normalizado
  await db.collection('users').insertOne({
    nombre,
    telefono: telefonoNormalizado,
    createdAt: new Date()
  });

  return NextResponse.json({ success: true });
}
```

### Ejemplo: Búsqueda Flexible

```typescript
// app/api/clientes/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { phoneUtils } from '@/lib/utils';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const telefono = searchParams.get('telefono');

  if (!telefono) {
    return NextResponse.json(
      { error: 'Teléfono requerido' },
      { status: 400 }
    );
  }

  // Normalizar búsqueda
  const telefonoNormalizado = phoneUtils.normalize(telefono);

  const client = await clientPromise;
  const db = client.db('nailsalon');
  
  // Buscar por teléfono normalizado
  const cliente = await db.collection('users').findOne({
    telefono: telefonoNormalizado
  });

  if (!cliente) {
    return NextResponse.json(
      { success: false, message: 'Cliente no encontrado' }
    );
  }

  return NextResponse.json({
    success: true,
    data: cliente
  });
}
```

## 🧪 Testing

### Jest/Vitest Tests

```typescript
import { phoneUtils } from '@/lib/utils';

describe('phoneUtils', () => {
  describe('normalize', () => {
    it('debe agregar +53 a números de 8 dígitos', () => {
      expect(phoneUtils.normalize('55551234')).toBe('+5355551234');
    });

    it('debe eliminar espacios', () => {
      expect(phoneUtils.normalize('5555 1234')).toBe('+5355551234');
    });

    it('debe eliminar guiones', () => {
      expect(phoneUtils.normalize('5555-1234')).toBe('+5355551234');
    });

    it('debe mantener +53 existente', () => {
      expect(phoneUtils.normalize('+5355551234')).toBe('+5355551234');
    });

    it('debe agregar + si comienza con 53', () => {
      expect(phoneUtils.normalize('5355551234')).toBe('+5355551234');
    });
  });

  describe('isValid', () => {
    it('debe validar números cubanos de 8 dígitos', () => {
      expect(phoneUtils.isValid('55551234')).toBe(true);
    });

    it('debe validar con código de país', () => {
      expect(phoneUtils.isValid('+53 5555 1234')).toBe(true);
    });

    it('debe rechazar números muy cortos', () => {
      expect(phoneUtils.isValid('123')).toBe(false);
    });

    it('debe rechazar letras', () => {
      expect(phoneUtils.isValid('abcd1234')).toBe(false);
    });
  });

  describe('format', () => {
    it('debe formatear con espacios', () => {
      expect(phoneUtils.format('+5355551234')).toBe('+53 5555 1234');
    });

    it('debe formatear entrada sin código', () => {
      expect(phoneUtils.format('55551234')).toBe('+53 5555 1234');
    });
  });
});
```

### Cypress E2E Tests

```typescript
describe('Phone Input Validation', () => {
  it('debe aceptar y normalizar teléfono válido', () => {
    cy.visit('/reserva');
    
    cy.get('input[name="telefono"]').type('5555 1234');
    cy.get('input[name="telefono"]').should('have.value', '5555 1234');
    
    // Verificar mensaje de confirmación
    cy.contains('Se guardará como: +53 5555 1234').should('be.visible');
  });

  it('debe mostrar error con teléfono inválido', () => {
    cy.visit('/reserva');
    
    cy.get('input[name="telefono"]').type('123');
    cy.get('input[name="telefono"]').blur();
    
    cy.contains('número cubano válido').should('be.visible');
  });

  it('debe encontrar cliente existente', () => {
    cy.visit('/reserva');
    
    // Cliente existe con teléfono +5355551234
    cy.get('input[name="telefono"]').type('5555 1234');
    
    // Esperar búsqueda
    cy.contains('Bienvenido de nuevo').should('be.visible');
    cy.get('input[name="nombre"]').should('be.disabled');
  });
});
```

## 📱 Casos de Uso Reales

### Caso 1: Registro de Nueva Reserva

```typescript
// Usuario ingresa: "5555 1234"
// Sistema normaliza: "+5355551234"
// Sistema busca: No existe
// Sistema: Permite registrar nuevo cliente
// Sistema guarda: "+5355551234"
```

### Caso 2: Cliente Existente

```typescript
// BD tiene: "+5355551234"
// Usuario ingresa: "5555-1234"
// Sistema normaliza: "+5355551234"
// Sistema busca: ✅ Encontrado
// Sistema: Carga datos del cliente
// Sistema: Deshabilita campo nombre
```

### Caso 3: Prevención de Duplicados

```typescript
// BD tiene: "+5355551234" → María García
// Usuario ingresa: "53 5555 1234"
// Sistema normaliza: "+5355551234"
// Sistema busca: ✅ Encontrado
// Sistema: "Este teléfono está registrado con María García"
// Sistema: Previene duplicado ✅
```

## 🎓 Mejores Prácticas

### ✅ Hacer

1. **Siempre normalizar antes de guardar**
   ```typescript
   const telefonoNormalizado = phoneUtils.normalize(input);
   await db.save({ telefono: telefonoNormalizado });
   ```

2. **Validar en cliente Y servidor**
   ```typescript
   // Cliente
   if (!phoneUtils.isValid(phone)) {
     setError('Número inválido');
     return;
   }
   
   // Servidor
   if (!phoneUtils.isValid(data.telefono)) {
     return NextResponse.json({ error: '...' }, { status: 400 });
   }
   ```

3. **Formatear para mostrar**
   ```typescript
   <p>Teléfono: {phoneUtils.format(cliente.telefono)}</p>
   ```

### ❌ No Hacer

1. **No guardar sin normalizar**
   ```typescript
   // ❌ MAL
   await db.save({ telefono: userInput });
   
   // ✅ BIEN
   await db.save({ telefono: phoneUtils.normalize(userInput) });
   ```

2. **No comparar sin normalizar**
   ```typescript
   // ❌ MAL
   if (phone1 === phone2) { }
   
   // ✅ BIEN
   if (phoneUtils.normalize(phone1) === phoneUtils.normalize(phone2)) { }
   ```

3. **No confiar solo en validación de cliente**
   ```typescript
   // ❌ MAL - Solo validar en frontend
   
   // ✅ BIEN - Validar en ambos lados
   ```

---

¿Necesitas más ejemplos o casos de uso específicos? ¡Pregunta!

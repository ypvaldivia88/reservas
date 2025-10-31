# 💅 Reservas - Nail Salon

Una aplicación moderna para gestionar reservas de un salón de uñas, construida con Next.js 15, TypeScript y MongoDB.

## ✨ Características

- 📝 **Formulario de reservas** con validación en tiempo real
- 🎨 **Interfaz moderna** con Tailwind CSS
- 🔒 **Validación robusta** tanto en frontend como backend
- 📱 **Design responsive** para móviles y desktop
- ⚡ **API REST** con manejo de errores completo
- 🗄️ **Base de datos MongoDB** con conexión optimizada

## 🚀 Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Base de datos**: MongoDB
- **Validación**: Custom hooks y utilidades

## 📋 Requisitos previos

- Node.js 18+ 
- MongoDB Atlas account (o instancia local)
- npm o yarn

## ⚙️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/reservas.git
   cd reservas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tu conexión MongoDB:
   ```env
   MONGODB_URI="mongodb+srv://usuario:password@cluster.mongodb.net/nailsalon"
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 📚 Estructura del proyecto

```
reservas/
├── app/
│   ├── api/reservas/          # API endpoints
│   ├── reserva/               # Página de reservas
│   ├── layout.tsx             # Layout principal
│   └── page.tsx               # Página de inicio
├── components/
│   └── ReservaForm.tsx        # Componente de formulario
├── lib/
│   ├── hooks/                 # Custom hooks
│   ├── mongodb.ts             # Configuración DB
│   ├── types.ts               # Tipos TypeScript
│   └── utils.ts               # Utilidades
└── middleware.ts              # Middleware de seguridad
```

## 🔧 Scripts disponibles

```bash
npm run dev          # Desarrollo con Turbopack
npm run build        # Construir para producción
npm run start        # Ejecutar en producción
npm run lint         # Linter ESLint
npm run lint:fix     # Arreglar errores de lint
npm run type-check   # Verificar tipos TypeScript
npm run format       # Formatear código con Prettier
```

## 🎯 Funcionalidades

### Reservas
- ✅ Crear nueva reserva
- ✅ Validación de campos requeridos
- ✅ Selección de forma de uñas (Coffin, Almond, Stiletto, Square)
- ✅ Selección de largo (1-8)
- ✅ Campo opcional para decoración
- ✅ Feedback visual en tiempo real

### Panel de Administración
- ✅ Ver lista completa de reservas
- ✅ Filtrar reservas por estado (pendiente, confirmada, cancelada, completada)
- ✅ Confirmar o cancelar reservas
- ✅ Editar información de la reserva (fecha, hora, detalles)
- ✅ Eliminar reservas
- ✅ Estadísticas en tiempo real

**Acceso:** `/admin`

### API Endpoints

#### `GET /api/reservas`
Obtiene todas las reservas ordenadas por fecha.

#### `POST /api/reservas`
Crea una nueva reserva con validación completa.

**Body ejemplo:**
```json
{
  "nombre": "María García",
  "telefono": "+34 612 345 678",
  "forma": "coffin",
  "largo": 5,
  "decoracion": "Francés con brillos"
}
```

#### `GET /api/reservas/[id]`
Obtiene una reserva específica por ID.

#### `PATCH /api/reservas/[id]`
Actualiza una reserva existente (estado, fecha, hora, detalles).

**Body ejemplo:**
```json
{
  "estado": "confirmada",
  "fechaCita": "2025-11-15",
  "horaCita": "14:00"
}
```

#### `DELETE /api/reservas/[id]`
Elimina una reserva específica.

## 🔒 Seguridad

- Headers de seguridad configurados
- Validación de entrada en API
- Sanitización de datos
- Manejo seguro de errores
- Variables de entorno protegidas

## 🚀 Deploy

### Vercel (Recomendado)
1. Fork o importa el proyecto en Vercel
2. Configura la variable `MONGODB_URI`
3. Deploy automático

### Otros providers
El proyecto es compatible con cualquier plataforma que soporte Next.js.

## 🤝 Contribuir

1. Fork del proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autor

- **Tu Nombre** - [@tu-usuario](https://github.com/tu-usuario)

---

⭐ ¡Dale una estrella al proyecto si te ha sido útil!

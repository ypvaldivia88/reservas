// Tipos para la aplicación de reservas
export interface Reserva {
  _id?: string;
  clienteId?: string;
  nombre: string;
  telefono: string;
  forma: 'coffin' | 'almond' | 'stiletto' | 'square';
  largo: number;
  decoracion?: string;
  fechaCreacion?: Date;
  fechaCita: string; // Formato YYYY-MM-DD
  horaCita: string; // Formato HH:mm
  estado?: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  costo?: number; // Costo de la reserva al completarla (para estadísticas futuras). Debe ser >= 0
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ReservaFormData {
  nombre: string;
  telefono: string;
  forma: string;
  largo: string;
  colores: string;
  decoracion: string;
  fechaCita: string;
  horaCita: string;
}

export type FormaUna = 'coffin' | 'almond' | 'stiletto' | 'square';

export const FORMAS_UNAS: FormaUna[] = [
  "stiletto",
  "almond",
  "coffin",
  "square",
];
export const LARGOS_UNAS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// Tipos para autenticación y usuarios
export type UserRole = 'admin' | 'cliente';

export interface User {
  _id?: string;
  nombre: string;
  telefono?: string; // Solo para clientes
  username?: string; // Solo para admin
  password?: string; // Solo para admin (hasheado)
  role: UserRole;
  fechaCreacion?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Tipos para imágenes y galerías
export interface ImageData {
  _id?: string;
  nombre: string;
  descripcion?: string;
  // Legacy support - will be removed after migration
  base64Data?: string; // Imagen codificada en base64 (deprecated)
  // New Vercel Blob storage
  blobUrl?: string; // URL de Vercel Blob Storage
  mimeType: string; // image/jpeg, image/png, etc.
  size?: number; // Tamaño en bytes
  titulo?: string; // Título para mostrar en galerías
  // Gallery assignments
  enGaleriaDashboard?: boolean; // "Nuestros trabajos" en dashboard
  enGaleriaInspiracion?: boolean; // "Galería de Inspiración" en reserva
  // Optional associations for filtering/organization
  categoriaIds?: string[]; // Referencias a Categorias
  servicioIds?: string[]; // Referencias a Servicios
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

export interface Servicio {
  _id?: string;
  nombre: string;
  descripcion: string;
  precio?: number;
  duracion?: number; // en minutos
  imagenId?: string; // Referencia a ImageData
  activo: boolean;
  orden?: number; // Para ordenar en la UI
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

export interface Categoria {
  _id?: string;
  nombre: string;
  descripcion?: string;
  imagenId?: string; // Referencia a ImageData
  activo: boolean;
  orden?: number;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

export interface GaleriaItem {
  _id?: string;
  titulo: string;
  descripcion?: string;
  imagenId: string; // Referencia a ImageData
  categoriaId?: string; // Opcional: puede estar vinculado a una categoría
  servicioId?: string; // Opcional: puede estar vinculado a un servicio
  destacado: boolean;
  orden?: number;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}
// Tipos para disponibilidad y horarios
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeSlot {
  time: string; // Formato HH:mm (24h), ej: "08:30", "14:00"
  available: boolean;
}

export interface DaySchedule {
  dayOfWeek: DayOfWeek;
  isWorkingDay: boolean;
  slots: TimeSlot[];
}

export interface Schedule {
  _id?: string;
  name: string; // "default" para el horario por defecto
  description?: string;
  schedule: DaySchedule[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AvailabilityOverride {
  _id?: string;
  date: string; // Formato YYYY-MM-DD
  slots: TimeSlot[];
  isWorkingDay: boolean;
  reason?: string; // ej: "Feriado", "Evento especial"
  createdAt?: Date;
}

// Horarios por defecto del negocio
export const DEFAULT_WORKING_DAYS: DayOfWeek[] = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
export const DEFAULT_TIME_SLOTS = ['08:30', '10:30', '14:00', '16:00'];

export const DAY_NAMES: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

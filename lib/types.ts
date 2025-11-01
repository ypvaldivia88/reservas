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
  fechaCita?: Date;
  horaCita?: string;
  estado?: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
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
}

export type FormaUna = 'coffin' | 'almond' | 'stiletto' | 'square';

export const FORMAS_UNAS: FormaUna[] = ['coffin', 'almond', 'stiletto', 'square'];
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
  base64Data: string; // Imagen codificada en base64
  mimeType: string; // image/jpeg, image/png, etc.
  size?: number; // Tamaño en bytes
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
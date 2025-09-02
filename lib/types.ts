// Tipos para la aplicación de reservas
export interface Reserva {
  _id?: string;
  nombre: string;
  telefono: string;
  forma: 'coffin' | 'almond' | 'stiletto' | 'square';
  largo: number;
  decoracion?: string;
  fechaCreacion?: Date;
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
  decoracion: string;
}

export type FormaUna = 'coffin' | 'almond' | 'stiletto' | 'square';

export const FORMAS_UNAS: FormaUna[] = ['coffin', 'almond', 'stiletto', 'square'];
export const LARGOS_UNAS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
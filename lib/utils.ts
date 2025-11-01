/**
 * Utilidades de validación para la aplicación
 */

export const validationUtils = {
  /**
   * Valida un número de teléfono
   */
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-()]{8,15}$/;
    return phoneRegex.test(phone.trim());
  },

  /**
   * Valida un nombre (mínimo 2 caracteres, solo letras y espacios)
   */
  isValidName: (name: string): boolean => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]{2,50}$/;
    return nameRegex.test(name.trim());
  },

  /**
   * Sanitiza una cadena de texto
   */
  sanitizeString: (str: string): string => {
    return str.trim().replace(/\s+/g, ' ');
  },

  /**
   * Valida si es un email válido (opcional para futuras funcionalidades)
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
};

/**
 * Mensajes de error estandarizados
 */
export const errorMessages = {
  required: 'Este campo es requerido',
  invalidName: 'El nombre debe tener entre 2 y 50 caracteres y solo contener letras',
  invalidPhone: 'El formato del teléfono no es válido',
  invalidEmail: 'El formato del email no es válido',
  invalidForm: 'Por favor, corrige los errores en el formulario',
  serverError: 'Error interno del servidor',
  connectionError: 'Error de conexión. Inténtalo de nuevo.',
};

/**
 * Función para formatear fechas
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

/**
 * Función para generar IDs únicos simples
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Utilidades para manejo de fechas en formato YYYY-MM-DD
 */
export const dateUtils = {
  /**
   * Parsea una fecha en formato YYYY-MM-DD a objeto Date
   * Asegura que la fecha se interprete en la zona horaria local
   */
  parseDate: (dateString: string): Date => {
    return new Date(dateString + 'T00:00:00');
  },

  /**
   * Convierte un objeto Date a string YYYY-MM-DD
   */
  formatToYYYYMMDD: (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   */
  getTodayString: (): string => {
    return dateUtils.formatToYYYYMMDD(new Date());
  },

  /**
   * Valida si una fecha string está en el futuro
   */
  isFutureDate: (dateString: string): boolean => {
    const date = dateUtils.parseDate(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  },

  /**
   * Valida formato HH:mm
   */
  isValidTimeFormat: (time: string): boolean => {
    return /^\d{2}:\d{2}$/.test(time);
  },
};

/**
 * Utilidades para schedules
 */
import type { Schedule, DaySchedule, DEFAULT_WORKING_DAYS as DAYS, DEFAULT_TIME_SLOTS as SLOTS, DayOfWeek } from "@/lib/types";

export const scheduleUtils = {
  /**
   * Crea el horario por defecto con los días y horarios estándar
   */
  createDefaultSchedule: (): Omit<Schedule, '_id'> => {
    const DEFAULT_WORKING_DAYS: DayOfWeek[] = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const DEFAULT_TIME_SLOTS = ['08:30', '10:30', '14:00', '16:00'];
    const allDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    const schedule: DaySchedule[] = allDays.map(dayOfWeek => {
      const isWorkingDay = DEFAULT_WORKING_DAYS.includes(dayOfWeek);
      return {
        dayOfWeek,
        isWorkingDay,
        slots: isWorkingDay ? DEFAULT_TIME_SLOTS.map(time => ({ time, available: true })) : []
      };
    });

    return {
      name: 'default',
      description: 'Horario por defecto: Martes a Sábado, 8:30 AM - 6:00 PM con descanso de almuerzo',
      schedule,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};

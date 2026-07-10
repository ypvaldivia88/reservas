import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utilidades de validación para la aplicación
 */

/**
 * Utilidades para normalización de números de teléfono
 */
export const phoneUtils = {
  /**
   * Normaliza un número de teléfono eliminando espacios, guiones, paréntesis
   * y asegurando que tenga el código de país +53 para Cuba
   */
  normalize: (phone: string): string => {
    // Validación de entrada
    if (!phone || typeof phone !== 'string') {
      throw new Error('Teléfono inválido: debe ser una cadena de texto');
    }

    // Eliminar todos los espacios, guiones, paréntesis y otros caracteres
    let normalized = phone.replace(/[\s\-()]/g, '');
    
    // Validar que tenga al menos dígitos
    if (!/\d/.test(normalized)) {
      throw new Error('Teléfono inválido: debe contener dígitos');
    }
    
    // Si comienza con +53, mantenerlo
    if (normalized.startsWith('+53')) {
      return normalized;
    }
    
    // Si comienza con 53 sin +, agregar el +
    if (normalized.startsWith('53')) {
      return '+' + normalized;
    }
    
    // Si no tiene código de país, agregar +53 (Cuba)
    if (normalized.length === 8) {
      return '+53' + normalized;
    }
    
    // Si ya tiene + pero no es +53, devolver tal cual
    if (normalized.startsWith('+')) {
      return normalized;
    }
    
    // Por defecto, agregar +53
    return '+53' + normalized;
  },

  /**
   * Formatea un número de teléfono para mostrar de forma amigable
   * Ejemplo: +53 5555 5555
   */
  format: (phone: string): string => {
    if (!phone || typeof phone !== 'string') {
      return '';
    }

    try {
      const normalized = phoneUtils.normalize(phone);
      
      // Formato para números cubanos (+53 XXXX XXXX)
      if (normalized.startsWith('+53') && normalized.length === 11) {
        return `+53 ${normalized.slice(3, 7)} ${normalized.slice(7)}`;
      }
      
      // Para otros formatos, devolver normalizado
      return normalized;
    } catch (error) {
      return phone; // Retornar el original si hay error
    }
  },

  /**
   * Valida que un número de teléfono tenga el formato correcto
   * Acepta números cubanos de 8 dígitos (con o sin +53)
   */
  isValid: (phone: string): boolean => {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    try {
      const normalized = phoneUtils.normalize(phone);
      
      // Validar formato cubano: +53 seguido de 8 dígitos
      const cubanPhoneRegex = /^\+53\d{8}$/;
      
      // También aceptar otros formatos internacionales básicos
      const internationalPhoneRegex = /^\+\d{10,15}$/;
      
      return cubanPhoneRegex.test(normalized) || internationalPhoneRegex.test(normalized);
    } catch (error) {
      return false;
    }
  },

  /**
   * Obtiene una versión del teléfono para comparación (sin +, sin espacios)
   * Útil para buscar duplicados
   */
  getComparisonKey: (phone: string): string => {
    if (!phone || typeof phone !== 'string') {
      return '';
    }

    try {
      return phoneUtils.normalize(phone).replace(/\+/g, '');
    } catch (error) {
      return phone.replace(/[\s\-+()\+]/g, '');
    }
  }
};

export const validationUtils = {
  /**
   * Valida un número de teléfono usando las utilidades de phoneUtils
   */
  isValidPhone: (phone: string): boolean => {
    return phoneUtils.isValid(phone);
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
  invalidPhone: 'Ingresa un número cubano válido de 8 dígitos',
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

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

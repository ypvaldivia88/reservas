// ─── Multi-tenant ───────────────────────────────────────────────────────────

export type BusinessTemplate =
  | 'manicure'
  | 'peluqueria'
  | 'barberia'
  | 'tatuajes'
  | 'generic';

export interface SalonBranding {
  logoUrl?: string;
  logoSmallUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  heroImageUrl?: string;
}

export interface SalonFeature {
  title: string;
  description: string;
}

export interface SalonStat {
  number: string;
  label: string;
}

export interface SalonTestimonial {
  name: string;
  text: string;
  rating: number;
  service?: string;
}

export interface SalonProcessStep {
  title: string;
  description: string;
}

export interface SalonContent {
  heroTitle?: string;
  heroHighlight?: string;
  heroSubtitle?: string;
  featuresTitle?: string;
  featuresSubtitle?: string;
  features?: SalonFeature[];
  stats?: SalonStat[];
  testimonialsTitle?: string;
  testimonialsSubtitle?: string;
  testimonials?: SalonTestimonial[];
  processTitle?: string;
  processSubtitle?: string;
  processSteps?: SalonProcessStep[];
  processCta?: string;
  galleryTitle?: string;
  gallerySubtitle?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface SalonContact {
  address?: string;
  addressUrl?: string;
  phone?: string;
  hours?: string;
}

export interface SalonSocial {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  tiktok?: string;
}

export interface Salon {
  _id?: string;
  salonId: string;
  slug: string;
  nombre: string;
  whatsappNumber?: string;
  timezone?: string;
  currency?: string;
  status: 'active' | 'inactive' | 'suspended';
  businessTemplate?: BusinessTemplate;
  branding?: SalonBranding;
  content?: SalonContent;
  contact?: SalonContact;
  social?: SalonSocial;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

export interface SalonCmsUpdateRequest {
  nombre?: string;
  whatsappNumber?: string;
  businessTemplate?: BusinessTemplate;
  branding?: Partial<SalonBranding>;
  content?: Partial<SalonContent>;
  contact?: Partial<SalonContact>;
  social?: Partial<SalonSocial>;
}

export interface SalonPublicProfile {
  salonId: string;
  slug: string;
  nombre: string;
  whatsappNumber?: string;
  businessTemplate: BusinessTemplate;
  branding: SalonBranding;
  content: SalonContent;
  contact: SalonContact;
  social: SalonSocial;
}

export interface SalonRegistrationRequest {
  nombre: string;
  slug: string;
  whatsappNumber?: string;
  businessTemplate?: BusinessTemplate;
  adminNombre: string;
  adminUsername: string;
  adminPassword: string;
}

export interface SalonRegistrationResult {
  salonId: string;
  slug: string;
  nombre: string;
  adminUsername: string;
  trialEndsAt: string;
}

// ─── Suscripciones ──────────────────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'semiannual' | 'yearly';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'pending_payment';
export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SubscriptionPlan {
  _id?: string;
  nombre: string;
  descripcion: string;
  /** Precio base mensual en USD */
  precioMensual: number;
  /** Descuento % al pagar 6 meses */
  descuentoSemestralPorcentaje: number;
  /** Descuento % al pagar anual */
  descuentoAnualPorcentaje: number;
  caracteristicas: string[];
  activo: boolean;
  orden?: number;
  fechaCreacion?: Date;
}

export interface TenantSubscription {
  _id?: string;
  salonId: string;
  planId: string;
  ciclo: BillingCycle;
  status: SubscriptionStatus;
  descuentoAplicado: number;
  periodoInicio?: Date;
  periodoFin?: Date;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

export interface PaymentRequest {
  _id?: string;
  salonId: string;
  planId: string;
  ciclo: BillingCycle;
  montoOriginal: number;
  descuentoPorcentaje: number;
  montoFinal: number;
  codigoReferencia: string;
  status: PaymentRequestStatus;
  notas?: string;
  fechaCreacion?: Date;
  fechaResolucion?: Date;
}

// ─── Finanzas ───────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'manual' | 'reserva' | 'import';
export type PaymentMethod = 'transferencia' | 'efectivo_cup';

export interface FinancialCategory {
  _id?: string;
  salonId: string;
  nombre: string;
  tipo: TransactionType;
  color?: string;
  activo: boolean;
  servicioId?: string;
  fechaCreacion?: Date;
}

export interface FinancialTransaction {
  _id?: string;
  salonId: string;
  tipo: TransactionType;
  categoriaId?: string;
  categoriaNombre?: string;
  monto: number;
  moneda?: string;
  metodoPago?: PaymentMethod;
  fecha: string;
  descripcion: string;
  fuente: TransactionSource;
  reservaId?: string;
  fechaCreacion?: Date;
}

export interface FinancialReport {
  periodo: { desde: string; hasta: string };
  resumen: {
    ingresos: number;
    gastos: number;
    balance: number;
  };
  ingresosPorCategoria: { categoria: string; total: number }[];
  gastosPorCategoria: { categoria: string; total: number }[];
  ingresosPorMes: { mes: string; total: number }[];
  gastosPorMes: { mes: string; total: number }[];
  ingresosPorReservas: number;
  ingresosManuales: number;
  ingresosPorMetodoPago: {
    metodo: PaymentMethod;
    label: string;
    total: number;
  }[];
}

// ─── Reservas ───────────────────────────────────────────────────────────────

export interface Reserva {
  _id?: string;
  salonId?: string;
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
  /** @deprecated Usar servicioIds. Se mantiene por compatibilidad con datos existentes. */
  servicioId?: string;
  servicioIds?: string[]; // Servicios consumidos al cerrar el turno
  /** @deprecated Usar cobroEfectivo/cobroTransferencia */
  metodoPago?: PaymentMethod;
  cobroEfectivo?: number; // Monto cobrado en efectivo (opcional)
  cobroTransferencia?: number; // Monto cobrado por transferencia (opcional)
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
export type UserRole = 'platform_admin' | 'salon_admin' | 'admin' | 'cliente';

export interface User {
  _id?: string;
  salonId?: string;
  nombre: string;
  telefono?: string; // Solo para clientes
  username?: string; // Solo para admin
  password?: string; // Solo para admin (hasheado)
  role: UserRole;
  fechaCreacion?: Date;
}

export interface SessionData {
  token: string;
  userId: string;
  username?: string;
  role: UserRole;
  salonId?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  nombre?: string;
  username?: string;
}

export interface AdminUserUpdateRequest {
  nombre?: string;
  username?: string;
  newPassword?: string;
}

export interface UserProfile {
  _id: string;
  nombre: string;
  username?: string;
  role: UserRole;
  salonId?: string;
}

// Tipos para imágenes y galerías
export interface ImageData {
  _id?: string;
  salonId?: string;
  nombre: string;
  descripcion?: string;
  blobUrl: string; // URL de Vercel Blob Storage (REQUIRED)
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
  salonId?: string;
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
  salonId?: string;
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
  salonId?: string;
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
  salonId?: string;
  name: string; // "default" para el horario por defecto
  description?: string;
  schedule: DaySchedule[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AvailabilityOverride {
  _id?: string;
  salonId?: string;
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

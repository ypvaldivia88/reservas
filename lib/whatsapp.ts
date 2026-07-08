// WhatsApp notification service using WhatsApp Web/App links
// This allows the client to send a message directly from their own WhatsApp

import { BillingCycle } from "@/lib/types";
import { getBillingCycleLabel, SUBSCRIPTION_CURRENCY } from "@/lib/subscription";

// Platform WhatsApp for subscription payments
const platformPhone =
  process.env.NEXT_PUBLIC_PLATFORM_WHATSAPP_NUMBER ||
  process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER ||
  "+5363233073";

// Admin WhatsApp number - can be overridden with environment variable or per-salon
const defaultAdminPhone =
  process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || "+5363233073";

/**
 * Resuelve el número de WhatsApp de un salón desde su perfil/CMS.
 */
export function resolveSalonWhatsapp(salon: {
  whatsappNumber?: string;
  contact?: { phone?: string };
  social?: { whatsapp?: string };
}): string | undefined {
  const raw =
    salon.social?.whatsapp?.trim() ||
    salon.whatsappNumber?.trim() ||
    salon.contact?.phone?.trim();
  return raw || undefined;
}

/**
 * Get admin phone for a salon (falls back to default)
 */
export function getSalonWhatsAppNumber(salonWhatsapp?: string): string {
  return salonWhatsapp || defaultAdminPhone;
}

/**
 * Enlace wa.me para contactar al salón
 */
export function buildSalonWhatsAppLink(
  salonWhatsapp: string | undefined,
  text: string
): string {
  const phone = getSalonWhatsAppNumber(salonWhatsapp);
  return `https://wa.me/${cleanPhoneNumber(phone)}?text=${encodeURIComponent(text)}`;
}

/**
 * Clean phone number by removing all non-digit characters
 * @param phone - Phone number to clean
 * @returns Phone number with only digits
 */
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export interface ReservaDetails {
  nombre: string;
  telefono: string;
  fechaCita: string;
  horaCita: string;
  forma: string;
  largo: number;
  decoracion?: string;
  imagenReferencia?: string; // URL de imagen de galería de inspiración
}

/**
 * Generate WhatsApp link for the client to send notification to admin
 * @param reserva - Reservation details
 * @param reservaId - ID of the reservation for direct admin link
 * @returns WhatsApp URL
 */
export function generateWhatsAppNotificationLink(
  reserva: ReservaDetails,
  reservaId: string,
  salonWhatsapp: string
): string {
  const adminPhone = cleanPhoneNumber(salonWhatsapp);
  // Build the admin edit link
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const adminLink = `${baseUrl}/admin/calendario?reserva=${reservaId}`;

  // Build the message
  const message = `🆕 *Nueva Reserva de Uñas*

👤 *Cliente:* ${reserva.nombre}
📞 *Teléfono:* ${reserva.telefono}
📅 *Fecha:* ${reserva.fechaCita}
🕐 *Hora:* ${reserva.horaCita}
💅 *Forma:* ${reserva.forma}
📏 *Largo:* ${reserva.largo}
${reserva.decoracion ? `🎨 *Decoración:* ${reserva.decoracion}` : ""}
${reserva.imagenReferencia ? `\n🖼️ *Imagen de Referencia:*\n${reserva.imagenReferencia}` : ""}

🔗 *Gestionar reserva:*
${adminLink}

_Click en el link para confirmar, editar o cancelar la reserva._`;

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);

  // Generate WhatsApp link
  // Use api.whatsapp.com for better compatibility with mobile and desktop
  const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhoneNumber(adminPhone)}&text=${encodedMessage}`;

  return whatsappLink;
}

/**
 * Open WhatsApp with the notification message
 * @param reserva - Reservation details
 * @param reservaId - ID of the reservation
 */
export function openWhatsAppNotification(
  reserva: ReservaDetails,
  reservaId: string,
  salonWhatsapp?: string
): boolean {
  if (!salonWhatsapp?.trim()) return false;

  const whatsappLink = generateWhatsAppNotificationLink(
    reserva,
    reservaId,
    salonWhatsapp.trim()
  );

  if (typeof window !== "undefined") {
    window.open(whatsappLink, "_blank");
  }
  return true;
}

/**
 * Generate WhatsApp link to notify client about reservation confirmation
 * @param clientPhone - Client's phone number
 * @param reserva - Reservation details
 * @returns WhatsApp URL
 */
export function generateConfirmationWhatsAppLink(
  clientPhone: string,
  reserva: ReservaDetails
): string {
  const message = `✅ *Reserva Confirmada*

Hola ${reserva.nombre}, tu reserva ha sido confirmada.

📅 *Fecha:* ${reserva.fechaCita}
🕐 *Hora:* ${reserva.horaCita}
💅 *Forma:* ${reserva.forma}
📏 *Largo:* ${reserva.largo}
${reserva.decoracion ? `🎨 *Decoración:* ${reserva.decoracion}` : ''}

¡Te esperamos! 💖`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhoneNumber(clientPhone)}&text=${encodedMessage}`;
  
  return whatsappLink;
}

/**
 * Open WhatsApp to notify client about reservation confirmation
 * @param clientPhone - Client's phone number
 * @param reserva - Reservation details
 */
export function openConfirmationWhatsApp(
  clientPhone: string,
  reserva: ReservaDetails
): void {
  const whatsappLink = generateConfirmationWhatsAppLink(clientPhone, reserva);
  
  if (typeof window !== 'undefined') {
    window.open(whatsappLink, '_blank');
  }
}

/**
 * Generate WhatsApp link to notify client about reservation cancellation
 * @param clientPhone - Client's phone number
 * @param reserva - Reservation details
 * @returns WhatsApp URL
 */
export function generateCancellationWhatsAppLink(
  clientPhone: string,
  reserva: ReservaDetails
): string {
  const message = `❌ *Reserva Cancelada*

Hola ${reserva.nombre}, lamentamos informarte que tu reserva ha sido cancelada.

📅 *Fecha:* ${reserva.fechaCita}
🕐 *Hora:* ${reserva.horaCita}

Si deseas hacer una nueva reserva, no dudes en contactarnos.`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhoneNumber(clientPhone)}&text=${encodedMessage}`;
  
  return whatsappLink;
}

/**
 * Open WhatsApp to notify client about reservation cancellation
 * @param clientPhone - Client's phone number
 * @param reserva - Reservation details
 */
export function openCancellationWhatsApp(
  clientPhone: string,
  reserva: ReservaDetails
): void {
  const whatsappLink = generateCancellationWhatsAppLink(clientPhone, reserva);
  
  if (typeof window !== 'undefined') {
    window.open(whatsappLink, '_blank');
  }
}

/**
 * Generate WhatsApp link to consult with expert
 * @param clientName - Client's name
 * @param clientPhone - Client's phone number
 * @returns WhatsApp URL
 */
export function generateConsultExpertWhatsAppLink(
  clientName: string,
  clientPhone: string,
  salonWhatsapp?: string
): string {
  const adminPhone = getSalonWhatsAppNumber(salonWhatsapp);
  // Check if client info is provided
  const hasClientInfo = clientName?.trim() && clientPhone?.trim();

  const message =
    hasClientInfo ?
      `👋 Hola, soy *${clientName}*.

Quisiera consultar con una experta sobre diseños de uñas y opciones disponibles.

Mi número de contacto es: ${clientPhone}

¡Gracias! 💅✨`
    : `👋 Hola!

Quisiera consultar con una experta sobre diseños de uñas y opciones disponibles.

¡Gracias! 💅✨`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhoneNumber(adminPhone)}&text=${encodedMessage}`;

  return whatsappLink;
}

/**
 * Open WhatsApp to consult with expert
 * @param clientName - Client's name
 * @param clientPhone - Client's phone number
 */
export function openConsultExpertWhatsApp(
  clientName: string,
  clientPhone: string,
  salonWhatsapp?: string
): void {
  const whatsappLink = generateConsultExpertWhatsAppLink(clientName, clientPhone, salonWhatsapp);
  
  if (typeof window !== 'undefined') {
    window.open(whatsappLink, '_blank');
  }
}

/**
 * Generate WhatsApp link to send reference image
 * @param clientName - Client's name
 * @param clientPhone - Client's phone number
 * @returns WhatsApp URL
 */
export function generateSendReferenceWhatsAppLink(
  clientName: string,
  clientPhone: string,
  salonWhatsapp?: string
): string {
  const adminPhone = getSalonWhatsAppNumber(salonWhatsapp);
  const message = `👋 Hola, soy *${clientName}*.

Quisiera enviarles una imagen de referencia para el diseño de uñas que me gustaría.

Mi número de contacto es: ${clientPhone}

(Enviaré la imagen a continuación)

¡Gracias! 💅📸`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhoneNumber(adminPhone)}&text=${encodedMessage}`;
  
  return whatsappLink;
}

/**
 * Open WhatsApp to send reference image
 * @param clientName - Client's name
 * @param clientPhone - Client's phone number
 */
export function openSendReferenceWhatsApp(
  clientName: string,
  clientPhone: string,
  salonWhatsapp?: string
): void {
  const whatsappLink = generateSendReferenceWhatsAppLink(clientName, clientPhone, salonWhatsapp);
  
  if (typeof window !== 'undefined') {
    window.open(whatsappLink, '_blank');
  }
}

/**
 * Generate WhatsApp link to consult about custom design
 * @param clientName - Client's name
 * @param clientPhone - Client's phone number
 * @returns WhatsApp URL
 */
export function generateCustomDesignWhatsAppLink(
  clientName: string,
  clientPhone: string,
  salonWhatsapp?: string
): string {
  const adminPhone = getSalonWhatsAppNumber(salonWhatsapp);
  const message = `👋 Hola, soy *${clientName}*.

Estoy interesada en consultar sobre un diseño personalizado de uñas.

Mi número de contacto es: ${clientPhone}

¿Podemos hablar sobre las opciones disponibles?

¡Gracias! 💅✨🎨`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhoneNumber(adminPhone)}&text=${encodedMessage}`;
  
  return whatsappLink;
}

/**
 * Open WhatsApp to consult about custom design
 * @param clientName - Client's name
 * @param clientPhone - Client's phone number
 */
export function openCustomDesignWhatsApp(
  clientName: string,
  clientPhone: string,
  salonWhatsapp?: string
): void {
  const whatsappLink = generateCustomDesignWhatsAppLink(clientName, clientPhone, salonWhatsapp);
  
  if (typeof window !== 'undefined') {
    window.open(whatsappLink, '_blank');
  }
}

/**
 * Generate WhatsApp link for client to notify admin about cancellation
 * @param reserva - Reservation details
 * @param reservaId - ID of the reservation
 * @param motivo - Optional reason for cancellation
 * @returns WhatsApp URL
 */
export function generateClientCancellationWhatsAppLink(
  reserva: ReservaDetails,
  reservaId: string,
  motivo: string | undefined,
  salonWhatsapp: string
): string {
  const adminPhone = cleanPhoneNumber(salonWhatsapp);
  // Build the admin link
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const adminLink = `${baseUrl}/admin/calendario?reserva=${reservaId}`;
  
  // Build the message
  const message = `❌ *Solicitud de Cancelación de Reserva*

👤 *Cliente:* ${reserva.nombre}
📞 *Teléfono:* ${reserva.telefono}
📅 *Fecha:* ${reserva.fechaCita}
🕐 *Hora:* ${reserva.horaCita}
💅 *Forma:* ${reserva.forma}
📏 *Largo:* ${reserva.largo}
${reserva.decoracion ? `🎨 *Decoración:* ${reserva.decoracion}` : ''}
${motivo ? `\n📝 *Motivo:* ${motivo}` : ''}

🔗 *Gestionar reserva:*
${adminLink}

_El cliente solicita cancelar esta reserva. Click en el link para procesar la cancelación._`;

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generate WhatsApp link
  const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhoneNumber(adminPhone)}&text=${encodedMessage}`;
  
  return whatsappLink;
}

/**
 * Open WhatsApp to notify admin about client cancellation
 * @param reserva - Reservation details
 * @param reservaId - ID of the reservation
 * @param motivo - Optional reason for cancellation
 */
export function openClientCancellationWhatsApp(
  reserva: ReservaDetails,
  reservaId: string,
  motivo?: string,
  salonWhatsapp?: string
): boolean {
  if (!salonWhatsapp?.trim()) return false;

  const whatsappLink = generateClientCancellationWhatsAppLink(
    reserva,
    reservaId,
    motivo,
    salonWhatsapp.trim()
  );

  if (typeof window !== "undefined") {
    window.open(whatsappLink, "_blank");
  }
  return true;
}

export interface SubscriptionPaymentDetails {
  salonNombre: string;
  planNombre: string;
  ciclo: BillingCycle;
  montoOriginal: number;
  descuentoPorcentaje: number;
  montoFinal: number;
  codigoReferencia: string;
}

/**
 * Generate WhatsApp link for manual subscription payment
 */
export function generateSubscriptionPaymentWhatsAppLink(
  details: SubscriptionPaymentDetails
): string {
  const cicloLabel = getBillingCycleLabel(details.ciclo);
  const descuentoText =
    details.descuentoPorcentaje > 0
      ? `\n🏷️ *Descuento:* ${details.descuentoPorcentaje}%`
      : '';

  const message = `💳 *Pago de Suscripción*

🏪 *Salón:* ${details.salonNombre}
📦 *Plan:* ${details.planNombre}
📅 *Ciclo:* ${cicloLabel}
💰 *Precio original:* ${details.montoOriginal.toFixed(2)} ${SUBSCRIPTION_CURRENCY}${descuentoText}
✅ *Total a pagar:* ${details.montoFinal.toFixed(2)} ${SUBSCRIPTION_CURRENCY}

🔖 *Código de referencia:* ${details.codigoReferencia}

He realizado el pago por transferencia/efectivo. Adjunto comprobante si aplica.

¡Gracias!`;

  const encodedMessage = encodeURIComponent(message);
  const phone = cleanPhoneNumber(platformPhone);
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
}

/**
 * Open WhatsApp for subscription payment
 */
export function openSubscriptionPaymentWhatsApp(
  details: SubscriptionPaymentDetails
): void {
  const link = generateSubscriptionPaymentWhatsAppLink(details);
  if (typeof window !== 'undefined') {
    window.open(link, '_blank');
  }
}


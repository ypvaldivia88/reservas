// WhatsApp notification service using WhatsApp Web/App links
// This allows the client to send a message directly from their own WhatsApp

// Admin WhatsApp number - can be overridden with environment variable
const adminPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || '+5363233073';

export interface ReservaDetails {
  nombre: string;
  telefono: string;
  fechaCita: string;
  horaCita: string;
  forma: string;
  largo: number;
  decoracion?: string;
}

/**
 * Generate WhatsApp link for the client to send notification to admin
 * @param reserva - Reservation details
 * @param reservaId - ID of the reservation for direct admin link
 * @returns WhatsApp URL
 */
export function generateWhatsAppNotificationLink(
  reserva: ReservaDetails,
  reservaId: string
): string {
  // Build the admin edit link
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const adminLink = `${baseUrl}/admin/dashboard?reserva=${reservaId}`;
  
  // Build the message
  const message = `🆕 *Nueva Reserva de Uñas*

👤 *Cliente:* ${reserva.nombre}
📞 *Teléfono:* ${reserva.telefono}
📅 *Fecha:* ${reserva.fechaCita}
🕐 *Hora:* ${reserva.horaCita}
💅 *Forma:* ${reserva.forma}
📏 *Largo:* ${reserva.largo}
${reserva.decoracion ? `🎨 *Decoración:* ${reserva.decoracion}` : ''}

🔗 *Gestionar reserva:*
${adminLink}

_Click en el link para confirmar, editar o cancelar la reserva._`;

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generate WhatsApp link
  // Use api.whatsapp.com for better compatibility with mobile and desktop
  const whatsappLink = `https://api.whatsapp.com/send?phone=${adminPhone.replace(/\D/g, '')}&text=${encodedMessage}`;
  
  return whatsappLink;
}

/**
 * Open WhatsApp with the notification message
 * @param reserva - Reservation details
 * @param reservaId - ID of the reservation
 */
export function openWhatsAppNotification(
  reserva: ReservaDetails,
  reservaId: string
): void {
  const whatsappLink = generateWhatsAppNotificationLink(reserva, reservaId);
  
  // Open in new window/tab
  if (typeof window !== 'undefined') {
    window.open(whatsappLink, '_blank');
  }
}


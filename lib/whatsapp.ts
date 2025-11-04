// WhatsApp notification service using Twilio
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // Format: whatsapp:+14155238886
const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '+5363233073';

// Initialize Twilio client only if credentials are available
let client: ReturnType<typeof twilio> | null = null;

if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
  } catch (error) {
    console.error('Error initializing Twilio client:', error);
  }
}

export interface WhatsAppNotification {
  type: 'new_reservation' | 'new_client';
  data: {
    nombre: string;
    telefono: string;
    fechaCita?: string;
    horaCita?: string;
    forma?: string;
    largo?: number;
  };
}

/**
 * Send WhatsApp notification to admin
 */
export async function sendAdminNotification(notification: WhatsAppNotification): Promise<{ success: boolean; error?: string }> {
  // If Twilio is not configured, log and return success (graceful degradation)
  if (!client || !whatsappFrom) {
    console.log('⚠️ WhatsApp notifications not configured. Notification would have been sent:', notification);
    return { success: true }; // Return success to not break the flow
  }

  try {
    let message = '';
    
    if (notification.type === 'new_reservation') {
      message = `🆕 Nueva Reserva
      
👤 Cliente: ${notification.data.nombre}
📞 Teléfono: ${notification.data.telefono}
📅 Fecha: ${notification.data.fechaCita}
🕐 Hora: ${notification.data.horaCita}
💅 Forma: ${notification.data.forma}
📏 Largo: ${notification.data.largo}

Por favor, revisa el panel de administración para más detalles.`;
    } else if (notification.type === 'new_client') {
      message = `🆕 Nuevo Cliente Registrado
      
👤 Nombre: ${notification.data.nombre}
📞 Teléfono: ${notification.data.telefono}

El cliente se ha registrado en el sistema.`;
    }

    const result = await client.messages.create({
      from: whatsappFrom,
      to: `whatsapp:${adminPhone}`,
      body: message,
    });

    console.log('✅ WhatsApp notification sent successfully:', result.sid);
    return { success: true };

  } catch (error) {
    console.error('❌ Error sending WhatsApp notification:', error);
    // Return success anyway to not break the reservation/registration flow
    return { 
      success: true, // Don't fail the main operation
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if WhatsApp notifications are configured
 */
export function isWhatsAppConfigured(): boolean {
  return !!(client && whatsappFrom);
}

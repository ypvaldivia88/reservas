import type { SubscriptionAccessState } from "@/lib/subscription";

export interface PublicUnavailableCopy {
  title: string;
  description: string;
  hint?: string;
}

export function getPublicUnavailableCopy(
  accessState: SubscriptionAccessState
): PublicUnavailableCopy {
  switch (accessState) {
    case "expired":
      return {
        title: "Reservas en línea no disponibles",
        description:
          "Este salón no está aceptando reservas por la web en este momento. Suele ser una pausa temporal mientras renuevan su plan.",
        hint: "Si ya tenías una cita o quieres contactarlos, usa WhatsApp o el teléfono del salón.",
      };
    case "suspended":
      return {
        title: "Salón temporalmente suspendido",
        description:
          "Este espacio no está disponible en la plataforma ReservaSalón.",
        hint: "Si eres el administrador del salón, inicia sesión en el panel para revisar tu cuenta.",
      };
    case "no_subscription":
      return {
        title: "Sitio en preparación",
        description:
          "Este salón aún no ha activado su presencia en línea en ReservaSalón.",
        hint: "Vuelve a intentarlo más tarde o contacta al salón por otros medios.",
      };
    default:
      return {
        title: "No disponible temporalmente",
        description:
          "Este salón no puede recibir reservas en línea en este momento.",
      };
  }
}

import { BusinessTemplate } from "@/lib/types";

export type ReservaDetailsMode = "manicure" | "generic" | "services";

export interface ReservaWizardStepCopy {
  title: string;
  hint: string;
  shortLabel: string;
}

export interface ReservaPageBenefit {
  icon: string;
  title: string;
  desc: string;
}

export interface ReservaOptionalPreferencesCopy {
  title: string;
  subtitle: string;
  decorations: string[];
  showColorPicker: boolean;
  colorsSectionTitle?: string;
  decorationsSectionTitle?: string;
  customDecorationPlaceholder?: string;
  gallerySectionTitle?: string;
}

export interface ReservaTemplateConfig {
  registration: {
    nombreLabel: string;
    nombrePlaceholder: string;
    slugPlaceholder: string;
  };
  servicesSubtitle: string;
  page: {
    badge: string;
    heroTitle: string;
    heroHighlight: string;
    heroSubtitle: string;
    referenceTitle: string;
    referenceDescription: string;
    referenceWaMessage: string;
    benefitsTitle: string;
    benefits: ReservaPageBenefit[];
  };
  reservation: {
    wizard: {
      step1: ReservaWizardStepCopy & { nombrePlaceholder: string };
      step2: ReservaWizardStepCopy;
      step3: ReservaWizardStepCopy;
      step4: ReservaWizardStepCopy & {
        summaryTitle: string;
        afterTitle: string;
        afterBullets: string[];
        submitLabel: string;
        nextFromStep3: string;
      };
    };
    detailsMode: ReservaDetailsMode;
    genericDetails: {
      heading: string;
      description: string;
      notesLabel: string;
      notesPlaceholder: string;
      quickOptions: string[];
      defaultForma: string;
    };
    summaryDetailsLabel: string;
    optionalPreferences: ReservaOptionalPreferencesCopy;
    whatsappNewTitle: string;
    whatsappConfirmedTitle: string;
  };
}

function wizardSteps(
  step1Title: string,
  step1Hint: string,
  step3Title: string,
  step3Hint: string,
  step4AfterBullets: string[],
  nombrePlaceholder = "Ej: María García"
): ReservaTemplateConfig["reservation"]["wizard"] {
  return {
    step1: {
      title: "Tus datos",
      hint: "Teléfono y nombre — lo mínimo para contactarte",
      shortLabel: "Datos",
      nombrePlaceholder,
    },
    step2: {
      title: "Fecha y hora",
      hint: "Elige el día y la hora que te venga bien",
      shortLabel: "Fecha",
    },
    step3: {
      title: step3Title,
      hint: step3Hint,
      shortLabel: step3Title.split(" ").slice(-1)[0] || "Detalles",
    },
    step4: {
      title: "Confirmar",
      hint: "Revisa el resumen y confirma tu cita",
      shortLabel: "Confirmar",
      summaryTitle: "Resumen de tu cita",
      afterTitle: "Qué pasa después",
      afterBullets: step4AfterBullets,
      submitLabel: "Confirmar cita",
      nextFromStep3: "Ver resumen →",
    },
  };
}

const manicureConfig: ReservaTemplateConfig = {
  registration: {
    nombreLabel: "Nombre del salón",
    nombrePlaceholder: "Ej: Bella Nails Studio",
    slugPlaceholder: "bella-nails",
  },
  servicesSubtitle:
    "Servicios de uñas, nail art y cuidado de manos pensados para ti",
  page: {
    badge: "Reserva en pocos pasos",
    heroTitle: "Reserva tu",
    heroHighlight: "cita de manicura",
    heroSubtitle:
      "Solo necesitamos lo esencial. Los colores y la decoración son opcionales — puedes decidirlo después con tu manicurista.",
    referenceTitle: "¿Tienes una imagen de referencia?",
    referenceDescription:
      "Si encontraste un diseño que te gusta, envíanoslo por WhatsApp y lo recrearemos para ti",
    referenceWaMessage: "Hola, quiero enviar una referencia de diseño de uñas",
    benefitsTitle: "¿Por qué reservar con nosotros?",
    benefits: [
      {
        icon: "⏰",
        title: "Horarios flexibles",
        desc: "Disponibilidad de lunes a sábado con horarios que se adaptan a ti",
      },
      {
        icon: "💎",
        title: "Calidad premium",
        desc: "Solo utilizamos los mejores productos y técnicas profesionales",
      },
      {
        icon: "🎯",
        title: "Atención personalizada",
        desc: "Cada servicio se adapta a tus gustos y necesidades específicas",
      },
    ],
  },
  reservation: {
    wizard: wizardSteps(
      "Tus datos",
      "Teléfono y nombre — lo mínimo para contactarte",
      "Tu manicura",
      "Puedes dejar la recomendación del salón y seguir",
      [
        "Te contactaremos para confirmar tu cita",
        "Duración aproximada: 60–90 minutos",
        "Puedes reagendar o cancelar con 24 h de anticipación",
      ]
    ),
    detailsMode: "manicure",
    genericDetails: {
      heading: "",
      description: "",
      notesLabel: "",
      notesPlaceholder: "",
      quickOptions: [],
      defaultForma: "square",
    },
    summaryDetailsLabel: "Forma",
    optionalPreferences: {
      title: "Colores y decoración",
      subtitle: "Opcional — puedes saltarlo",
      decorations: [
        "Francés clásico",
        "Con brillos",
        "Degradado",
        "Con piedras",
        "Flores",
        "Diseño abstracto",
        "Nail art personalizado",
      ],
      showColorPicker: true,
      colorsSectionTitle: "Colores que te gustan",
      decorationsSectionTitle: "Decoración o diseño",
      customDecorationPlaceholder:
        "Cuéntanos con tus palabras qué te gustaría (opcional)",
      gallerySectionTitle: "Inspiración de la galería",
    },
    whatsappNewTitle: "Nueva Reserva de Uñas",
    whatsappConfirmedTitle: "Reserva Confirmada",
  },
};

const peluqueriaConfig: ReservaTemplateConfig = {
  registration: {
    nombreLabel: "Nombre de la peluquería",
    nombrePlaceholder: "Ej: Estilo & Color",
    slugPlaceholder: "estilo-color",
  },
  servicesSubtitle: "Cortes, coloración y tratamientos para tu cabello",
  page: {
    badge: "Reserva tu cita",
    heroTitle: "Reserva tu",
    heroHighlight: "cita en el salón",
    heroSubtitle:
      "Indica el servicio que buscas y el horario que prefieres. Si tienes dudas, el equipo te asesora al confirmar.",
    referenceTitle: "¿Tienes una foto de referencia?",
    referenceDescription:
      "Envíanos por WhatsApp el estilo, color o peinado que te gustaría",
    referenceWaMessage: "Hola, quiero enviar una referencia de peinado o color",
    benefitsTitle: "¿Por qué reservar con nosotros?",
    benefits: [
      {
        icon: "✂️",
        title: "Estilistas expertos",
        desc: "Cortes, color y tratamientos con técnicas actualizadas",
      },
      {
        icon: "🎨",
        title: "Color personalizado",
        desc: "Asesoría para encontrar el tono y estilo que mejor te favorece",
      },
      {
        icon: "⏰",
        title: "Citas organizadas",
        desc: "Reserva en línea y confirma tu horario sin esperas innecesarias",
      },
    ],
  },
  reservation: {
    wizard: wizardSteps(
      "Tus datos",
      "",
      "Tu servicio",
      "Cuéntanos qué buscas o elige una opción rápida",
      [
        "Te contactaremos para confirmar tu cita",
        "La duración depende del servicio elegido",
        "Puedes reagendar o cancelar con 24 h de anticipación",
      ],
      "Ej: Ana López"
    ),
    detailsMode: "services",
    genericDetails: {
      heading: "¿Qué servicios te gustaría?",
      description:
        "Elige uno o varios servicios para tu cita. Si tienes dudas, el equipo te asesora al confirmar.",
      notesLabel: "Detalles del servicio",
      notesPlaceholder:
        "Ej: Corte en capas, balayage rubio miel, hidratación profunda…",
      quickOptions: [
        "Corte y peinado",
        "Coloración",
        "Tratamiento capilar",
        "Peinado para evento",
      ],
      defaultForma: "peluqueria",
    },
    summaryDetailsLabel: "Servicio",
    optionalPreferences: {
      title: "Referencias e inspiración",
      subtitle: "Opcional — fotos o ideas de color",
      decorations: [
        "Corte en capas",
        "Balayage",
        "Rubio",
        "Castaño",
        "Keratina",
        "Peinado recogido",
      ],
      showColorPicker: true,
      colorsSectionTitle: "Tonos de referencia",
      decorationsSectionTitle: "Estilo o tratamiento",
      customDecorationPlaceholder:
        "Describe el look que buscas o añade detalles (opcional)",
      gallerySectionTitle: "Inspiración de la galería",
    },
    whatsappNewTitle: "Nueva Reserva — Peluquería",
    whatsappConfirmedTitle: "Cita Confirmada",
  },
};

const barberiaConfig: ReservaTemplateConfig = {
  registration: {
    nombreLabel: "Nombre de la barbería",
    nombrePlaceholder: "Ej: The Gentleman Cut",
    slugPlaceholder: "gentleman-cut",
  },
  servicesSubtitle: "Cortes, barba y grooming con estilo clásico y moderno",
  page: {
    badge: "Reserva tu turno",
    heroTitle: "Reserva tu",
    heroHighlight: "cita en la barbería",
    heroSubtitle:
      "Elige fecha y hora, indica el corte o servicio de barba que necesitas y listo.",
    referenceTitle: "¿Tienes una foto de referencia?",
    referenceDescription:
      "Envíanos el estilo de corte o barba que quieres por WhatsApp",
    referenceWaMessage: "Hola, quiero enviar una referencia de corte o barba",
    benefitsTitle: "¿Por qué reservar con nosotros?",
    benefits: [
      {
        icon: "💈",
        title: "Barberos expertos",
        desc: "Cortes clásicos, fades y arreglo de barba con precisión",
      },
      {
        icon: "🪒",
        title: "Experiencia premium",
        desc: "Ambiente cómodo y atención enfocada en el detalle",
      },
      {
        icon: "⏰",
        title: "Sin esperas largas",
        desc: "Reserva tu franja y llega con tu turno asegurado",
      },
    ],
  },
  reservation: {
    wizard: wizardSteps(
      "Tus datos",
      "",
      "Tu corte",
      "Indica el estilo que buscas o elige una opción",
      [
        "Te contactaremos para confirmar tu cita",
        "Duración habitual: 30–60 minutos según el servicio",
        "Puedes reagendar o cancelar con 24 h de anticipación",
      ],
      "Ej: Carlos Méndez"
    ),
    detailsMode: "services",
    genericDetails: {
      heading: "¿Qué servicios necesitas?",
      description:
        "Selecciona uno o varios servicios. Puedes combinar corte, barba u otros en el mismo turno.",
      notesLabel: "Estilo o preferencias",
      notesPlaceholder: "Ej: Fade medio, barba perfilada, navaja en contornos…",
      quickOptions: [
        "Corte clásico",
        "Fade / degradado",
        "Arreglo de barba",
        "Combo corte + barba",
      ],
      defaultForma: "barberia",
    },
    summaryDetailsLabel: "Estilo",
    optionalPreferences: {
      title: "Referencias",
      subtitle: "Opcional — fotos o detalles extra",
      decorations: [
        "Degradado bajo",
        "Taper fade",
        "Barba con navaja",
        "Perfilado",
        "Cejas",
      ],
      showColorPicker: false,
      decorationsSectionTitle: "Detalles del look",
      customDecorationPlaceholder:
        "Añade notas sobre el estilo que buscas (opcional)",
      gallerySectionTitle: "Referencias de la galería",
    },
    whatsappNewTitle: "Nueva Reserva — Barbería",
    whatsappConfirmedTitle: "Cita Confirmada",
  },
};

const tatuajesConfig: ReservaTemplateConfig = {
  registration: {
    nombreLabel: "Nombre del estudio",
    nombrePlaceholder: "Ej: Ink District Studio",
    slugPlaceholder: "ink-district",
  },
  servicesSubtitle: "Diseños personalizados, consultas y sesiones de tatuaje",
  page: {
    badge: "Reserva tu sesión",
    heroTitle: "Reserva tu",
    heroHighlight: "cita en el estudio",
    heroSubtitle:
      "Cuéntanos tu idea, elige fecha y hora, y adjunta referencias si las tienes. El artista confirmará los detalles contigo.",
    referenceTitle: "¿Tienes bocetos o referencias?",
    referenceDescription:
      "Envíanos fotos del diseño, estilo o zona del cuerpo por WhatsApp antes de tu cita",
    referenceWaMessage: "Hola, quiero enviar referencias para mi tatuaje",
    benefitsTitle: "¿Por qué reservar con nosotros?",
    benefits: [
      {
        icon: "🎨",
        title: "Diseño personalizado",
        desc: "Cada pieza se adapta a tu idea, anatomía y estilo",
      },
      {
        icon: "🛡️",
        title: "Higiene certificada",
        desc: "Protocolos estrictos y materiales desechables en cada sesión",
      },
      {
        icon: "📅",
        title: "Consulta organizada",
        desc: "Reserva consulta o sesión con anticipación y sin sorpresas",
      },
    ],
  },
  reservation: {
    wizard: wizardSteps(
      "Tus datos",
      "",
      "Tu diseño",
      "Describe tu idea o elige el tipo de trabajo",
      [
        "El estudio te contactará para confirmar la cita",
        "La duración varía según tamaño y complejidad del diseño",
        "Puedes reagendar o cancelar con 24 h de anticipación",
      ],
      "Ej: Diego Fernández"
    ),
    detailsMode: "generic",
    genericDetails: {
      heading: "¿Qué tatuaje tienes en mente?",
      description:
        "Cuéntanos la idea, tamaño aproximado y zona del cuerpo. Puedes ampliar con fotos de referencia en el paso de confirmación.",
      notesLabel: "Idea o descripción",
      notesPlaceholder:
        "Ej: Línea fina en antebrazo, 8 cm, frase en cursiva, estilo minimalista…",
      quickOptions: [
        "Minimalista",
        "Tradicional",
        "Realismo",
        "Lettering",
        "Consulta de diseño",
      ],
      defaultForma: "tatuaje",
    },
    summaryDetailsLabel: "Diseño",
    optionalPreferences: {
      title: "Referencias visuales",
      subtitle: "Opcional — elige una imagen de inspiración",
      decorations: [
        "Blackwork",
        "Fine line",
        "Tradicional",
        "Neotradicional",
        "Cover-up",
        "Solo línea",
      ],
      showColorPicker: false,
      decorationsSectionTitle: "Estilo de tatuaje",
      customDecorationPlaceholder:
        "Zona del cuerpo, tamaño o detalles adicionales (opcional)",
      gallerySectionTitle: "Portafolio e inspiración",
    },
    whatsappNewTitle: "Nueva Reserva — Tatuaje",
    whatsappConfirmedTitle: "Cita Confirmada",
  },
};

const genericConfig: ReservaTemplateConfig = {
  registration: {
    nombreLabel: "Nombre del negocio",
    nombrePlaceholder: "Ej: Mi Negocio Local",
    slugPlaceholder: "mi-negocio",
  },
  servicesSubtitle: "Servicios disponibles para reservar en línea",
  page: {
    badge: "Reserva en línea",
    heroTitle: "Reserva tu",
    heroHighlight: "cita",
    heroSubtitle:
      "Indica tus datos, elige fecha y hora, y cuéntanos qué necesitas. El negocio confirmará los detalles contigo.",
    referenceTitle: "¿Quieres enviar más información?",
    referenceDescription:
      "Escríbenos por WhatsApp si tienes preguntas o material de referencia",
    referenceWaMessage: "Hola, tengo una consulta sobre mi reserva",
    benefitsTitle: "¿Por qué reservar con nosotros?",
    benefits: [
      {
        icon: "📅",
        title: "Reserva fácil",
        desc: "Agenda en pocos pasos desde cualquier dispositivo",
      },
      {
        icon: "⏰",
        title: "Horarios claros",
        desc: "Elige el momento que mejor se adapte a tu día",
      },
      {
        icon: "💬",
        title: "Confirmación directa",
        desc: "Te contactamos para cerrar los detalles de tu cita",
      },
    ],
  },
  reservation: {
    wizard: wizardSteps(
      "Tus datos",
      "",
      "Detalles",
      "Cuéntanos qué necesitas o elige una opción",
      [
        "Te contactaremos para confirmar tu cita",
        "La duración depende del servicio solicitado",
        "Puedes reagendar o cancelar con 24 h de anticipación",
      ]
    ),
    detailsMode: "generic",
    genericDetails: {
      heading: "¿En qué podemos ayudarte?",
      description:
        "Describe brevemente lo que buscas. El negocio confirmará los detalles contigo.",
      notesLabel: "Notas para tu cita",
      notesPlaceholder:
        "Ej: Primera visita, servicio básico, horario flexible…",
      quickOptions: [
        "Servicio básico",
        "Servicio premium",
        "Primera visita",
        "Consulta",
      ],
      defaultForma: "general",
    },
    summaryDetailsLabel: "Detalles",
    optionalPreferences: {
      title: "Preferencias adicionales",
      subtitle: "Opcional — puedes saltarlo",
      decorations: [
        "Primera vez",
        "Urgente",
        "Mañana preferible",
        "Tarde preferible",
      ],
      showColorPicker: false,
      decorationsSectionTitle: "Preferencias",
      customDecorationPlaceholder: "Añade notas adicionales (opcional)",
      gallerySectionTitle: "Galería de referencia",
    },
    whatsappNewTitle: "Nueva Reserva",
    whatsappConfirmedTitle: "Cita Confirmada",
  },
};

const CONFIG_BY_TEMPLATE: Record<BusinessTemplate, ReservaTemplateConfig> = {
  manicure: manicureConfig,
  peluqueria: peluqueriaConfig,
  barberia: barberiaConfig,
  tatuajes: tatuajesConfig,
  generic: genericConfig,
};

const NON_MANICURE_TEMPLATES = new Set<BusinessTemplate>([
  "peluqueria",
  "barberia",
  "tatuajes",
  "generic",
]);

export function getReservaTemplateConfig(
  template?: BusinessTemplate | null
): ReservaTemplateConfig {
  if (template && CONFIG_BY_TEMPLATE[template]) {
    return CONFIG_BY_TEMPLATE[template];
  }
  // Legacy / no slug / template not set — original wizard was always manicure
  return manicureConfig;
}

export function isManicureReservation(
  template?: BusinessTemplate | null
): boolean {
  if (!template) return true;
  return !NON_MANICURE_TEMPLATES.has(template);
}

export function usesServicePicker(
  template?: BusinessTemplate | null
): boolean {
  return getReservaTemplateConfig(template).reservation.detailsMode === "services";
}

export function formatActiveReservationDetail(
  reserva: {
    forma?: string;
    largo?: string | number;
    decoracion?: string;
    servicioIds?: string[];
  },
  template?: BusinessTemplate | null
): string {
  const config = getReservaTemplateConfig(template);
  if (config.reservation.detailsMode === "manicure") {
    const largo = reserva.largo ? `Largo #${reserva.largo}` : "";
    const parts = [reserva.forma, largo, reserva.decoracion].filter(Boolean);
    return parts.join(" • ");
  }
  if (
    config.reservation.detailsMode === "services" &&
    reserva.decoracion?.trim()
  ) {
    return reserva.decoracion;
  }
  return reserva.decoracion || reserva.forma || "Detalles a confirmar";
}

export interface ReservaWhatsAppPayload {
  nombre: string;
  telefono: string;
  fechaCita: string;
  horaCita: string;
  forma: string;
  largo: number;
  decoracion?: string;
  imagenReferencia?: string;
}

export function buildWhatsAppNotificationMessage(
  reserva: ReservaWhatsAppPayload,
  adminLink: string,
  template?: BusinessTemplate | null
): string {
  const config = getReservaTemplateConfig(template);
  const isManicure = config.reservation.detailsMode === "manicure";
  const detailLabel = config.reservation.summaryDetailsLabel;

  const detailLine = isManicure
    ? `💅 *Forma:* ${reserva.forma}\n📏 *Largo:* ${reserva.largo}`
    : `📋 *${detailLabel}:* ${reserva.decoracion || reserva.forma || "A confirmar"}`;

  const decoracionLine =
    isManicure && reserva.decoracion
      ? `\n🎨 *Decoración:* ${reserva.decoracion}`
      : !isManicure && reserva.decoracion
        ? ""
        : "";

  return `🆕 *${config.reservation.whatsappNewTitle}*

👤 *Cliente:* ${reserva.nombre}
📞 *Teléfono:* ${reserva.telefono}
📅 *Fecha:* ${reserva.fechaCita}
🕐 *Hora:* ${reserva.horaCita}
${detailLine}${decoracionLine}
${reserva.imagenReferencia ? `\n🖼️ *Imagen de referencia:*\n${reserva.imagenReferencia}` : ""}

🔗 *Gestionar reserva:*
${adminLink}

_Click en el link para confirmar, editar o cancelar la reserva._`;
}

export function buildWhatsAppConfirmationMessage(
  reserva: ReservaWhatsAppPayload,
  template?: BusinessTemplate | null
): string {
  const config = getReservaTemplateConfig(template);
  const isManicure = config.reservation.detailsMode === "manicure";
  const detailLabel = config.reservation.summaryDetailsLabel;

  const detailBlock = isManicure
    ? `💅 *Forma:* ${reserva.forma}\n📏 *Largo:* ${reserva.largo}${
        reserva.decoracion ? `\n🎨 *Decoración:* ${reserva.decoracion}` : ""
      }`
    : `📋 *${detailLabel}:* ${reserva.decoracion || reserva.forma || "A confirmar"}`;

  return `✅ *${config.reservation.whatsappConfirmedTitle}*

Hola ${reserva.nombre}, tu reserva ha sido confirmada.

📅 *Fecha:* ${reserva.fechaCita}
🕐 *Hora:* ${reserva.horaCita}
${detailBlock}

¡Te esperamos!`;
}

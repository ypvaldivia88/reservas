import { getTemplateHeroUrl } from "@/lib/placeholder-config";
import {
  BusinessTemplate,
  SalonBranding,
  SalonContent,
  SalonContact,
  SalonSocial,
} from "@/lib/types";

export interface TemplateService {
  nombre: string;
  descripcion: string;
  duracion?: number;
}

export interface BusinessTemplateConfig {
  id: BusinessTemplate;
  nombre: string;
  descripcion: string;
  icon: string;
  branding: SalonBranding;
  content: SalonContent;
  contact: Partial<SalonContact>;
  social: Partial<SalonSocial>;
  defaultServices: TemplateService[];
}

const manicureTemplate: BusinessTemplateConfig = {
  id: "manicure",
  nombre: "Manicure / Uñas",
  descripcion: "Salón de uñas, nail art y cuidado de manos",
  icon: "💅",
  branding: {
    primaryColor: "#2563eb",
    secondaryColor: "#7c3aed",
    accentColor: "#93c5fd",
    heroImageUrl: getTemplateHeroUrl("manicure"),
  },
  content: {
    heroTitle: "Belleza en tus",
    heroHighlight: "Manos",
    heroSubtitle:
      "Descubre la excelencia en el cuidado de uñas. Diseños únicos, técnicas profesionales y la mejor atención para que luzcas radiante.",
    featuresTitle: "¿Por qué elegirnos?",
    featuresSubtitle: "Experiencia, calidad y atención personalizada",
    features: [
      {
        title: "Profesionales Expertas",
        description:
          "Nuestro equipo cuenta con años de experiencia y certificaciones profesionales",
      },
      {
        title: "Productos Premium",
        description:
          "Utilizamos solo los mejores productos y esmaltes de marcas reconocidas",
      },
      {
        title: "Resultados Garantizados",
        description:
          "Satisfacción total garantizada en cada servicio que realizamos",
      },
    ],
    stats: [
      { number: "100+", label: "Clientas Felices" },
      { number: "4+", label: "Años de Experiencia" },
      { number: "6+", label: "Servicios Disponibles" },
      { number: "98%", label: "Satisfacción Garantizada" },
    ],
    testimonialsTitle: "Lo que dicen nuestras clientes",
    testimonialsSubtitle: "Testimonios reales de clientas satisfechas",
    testimonials: [
      {
        name: "María González",
        text: "El mejor salón de uñas de la ciudad. Siempre salgo encantada con mis diseños.",
        rating: 5,
        service: "Nail Art",
      },
      {
        name: "Ana Rodríguez",
        text: "Profesionales increíbles, productos de calidad y un ambiente muy relajante.",
        rating: 5,
        service: "Spa de Manos",
      },
      {
        name: "Carmen López",
        text: "Las extensiones me duran perfectas por semanas. Totalmente recomendado.",
        rating: 5,
        service: "Gel/Acrílico",
      },
    ],
    processTitle: "Nuestro Proceso",
    processSubtitle:
      "Un proceso simple y relajante diseñado para brindarte la mejor experiencia",
    processSteps: [
      {
        title: "Reserva tu cita",
        description: "Elige tu fecha y hora preferida online o por teléfono",
      },
      {
        title: "Consulta personalizada",
        description: "Conversamos sobre tus gustos y el diseño que deseas",
      },
      {
        title: "Servicio profesional",
        description: "Nuestras expertas trabajarán con los mejores productos",
      },
      {
        title: "Resultado perfecto",
        description: "Sal con unas uñas hermosas que durarán semanas",
      },
    ],
    processCta: "¿Lista para tu nueva manicure?",
    galleryTitle: "Nuestros Trabajos",
    gallerySubtitle: "Una muestra de nuestras creaciones más recientes",
    ctaTitle: "¿Lista para tu nueva manicure?",
    ctaSubtitle:
      "Agenda tu cita hoy y descubre por qué somos el salón favorito de la ciudad",
    seoDescription:
      "Salón de manicure profesional. Diseños únicos, productos premium y atención experta.",
  },
  contact: {
    hours: "Mart - Sáb: 8:30 AM - 6:00 PM",
  },
  social: {},
  defaultServices: [
    {
      nombre: "Gel / Softgel",
      descripcion:
        "Gel ligero y flexible, ideal para acabado natural y cómodo.",
      duracion: 60,
    },
    {
      nombre: "Base Rubber / Gel Builder",
      descripcion:
        "Gel reforzado para uñas débiles, perfecto para mayor resistencia y durabilidad.",
      duracion: 75,
    },
    {
      nombre: "Gel Dipping",
      descripcion:
        "Sistema sin monómero con polvo acrílico, uñas fuertes y acabado elegante.",
      duracion: 60,
    },
    {
      nombre: "Pedicure",
      descripcion:
        "Un servicio completo para pies suaves, saludables y bien cuidados.",
      duracion: 45,
    },
  ],
};

const peluqueriaTemplate: BusinessTemplateConfig = {
  id: "peluqueria",
  nombre: "Peluquería",
  descripcion: "Cortes, coloración y tratamientos capilares",
  icon: "✂️",
  branding: {
    primaryColor: "#db2777",
    secondaryColor: "#9333ea",
    accentColor: "#f9a8d4",
    heroImageUrl: getTemplateHeroUrl("peluqueria"),
  },
  content: {
    heroTitle: "Tu estilo,",
    heroHighlight: "Tu identidad",
    heroSubtitle:
      "Transformamos tu look con técnicas modernas, productos de calidad y un equipo apasionado por la belleza capilar.",
    featuresTitle: "¿Por qué elegirnos?",
    featuresSubtitle: "Estilo, innovación y cuidado personalizado",
    features: [
      {
        title: "Estilistas Certificados",
        description:
          "Profesionales con formación continua en las últimas tendencias",
      },
      {
        title: "Productos de Salón",
        description:
          "Marcas premium que cuidan y nutren tu cabello desde la raíz",
      },
      {
        title: "Asesoría Personalizada",
        description:
          "Te ayudamos a encontrar el look perfecto para tu estilo de vida",
      },
    ],
    stats: [
      { number: "200+", label: "Clientes Satisfechos" },
      { number: "5+", label: "Años de Experiencia" },
      { number: "10+", label: "Servicios" },
      { number: "99%", label: "Recomendación" },
    ],
    testimonialsTitle: "Lo que dicen nuestros clientes",
    testimonialsSubtitle: "Experiencias reales de quienes confían en nosotros",
    testimonials: [
      {
        name: "Laura Martínez",
        text: "El mejor corte que he tenido. Entienden exactamente lo que quiero.",
        rating: 5,
        service: "Corte y Peinado",
      },
      {
        name: "Sofía Ruiz",
        text: "Mi color quedó espectacular. Muy profesionales y atentas.",
        rating: 5,
        service: "Coloración",
      },
    ],
    processTitle: "Cómo trabajamos",
    processSubtitle: "Un proceso pensado para tu comodidad y el mejor resultado",
    processSteps: [
      {
        title: "Reserva online",
        description: "Elige el servicio y horario que mejor te convenga",
      },
      {
        title: "Diagnóstico capilar",
        description: "Analizamos tu cabello y te asesoramos sobre el tratamiento ideal",
      },
      {
        title: "Servicio profesional",
        description: "Aplicamos técnicas y productos de primera calidad",
      },
      {
        title: "Look final",
        description: "Sales con un estilo renovado y tips de mantenimiento",
      },
    ],
    processCta: "¿Lista para un cambio de look?",
    galleryTitle: "Nuestros Trabajos",
    gallerySubtitle: "Inspírate con nuestros últimos estilos",
    ctaTitle: "¿Lista para renovar tu look?",
    ctaSubtitle: "Reserva tu cita y déjanos cuidar de tu cabello",
    seoDescription:
      "Peluquería profesional. Cortes, coloración y tratamientos capilares de calidad.",
  },
  contact: { hours: "Lun - Sáb: 9:00 AM - 7:00 PM" },
  social: {},
  defaultServices: [
    {
      nombre: "Corte de Cabello",
      descripcion: "Corte personalizado según tu estilo y tipo de cabello.",
      duracion: 45,
    },
    {
      nombre: "Coloración",
      descripcion: "Tintes, mechas y técnicas de coloración profesional.",
      duracion: 120,
    },
    {
      nombre: "Peinado",
      descripcion: "Peinados para eventos, bodas y ocasiones especiales.",
      duracion: 60,
    },
    {
      nombre: "Tratamiento Capilar",
      descripcion: "Hidratación, keratina y tratamientos reparadores.",
      duracion: 90,
    },
  ],
};

const barberiaTemplate: BusinessTemplateConfig = {
  id: "barberia",
  nombre: "Barbería",
  descripcion: "Cortes clásicos, barba y grooming masculino",
  icon: "💈",
  branding: {
    primaryColor: "#1e293b",
    secondaryColor: "#d97706",
    accentColor: "#fbbf24",
    heroImageUrl: getTemplateHeroUrl("barberia"),
  },
  content: {
    heroTitle: "Estilo y",
    heroHighlight: "Tradición",
    heroSubtitle:
      "La barbería clásica reinventada. Cortes precisos, ambiente relajado y atención de primera para el caballero moderno.",
    featuresTitle: "La experiencia barber",
    featuresSubtitle: "Calidad, precisión y ambiente único",
    features: [
      {
        title: "Barberos Expertos",
        description:
          "Maestros del oficio con años de experiencia en cortes clásicos y modernos",
      },
      {
        title: "Ambiente Premium",
        description:
          "Un espacio diseñado para que disfrutes cada minuto de tu visita",
      },
      {
        title: "Productos de Calidad",
        description:
          "Pomadas, aceites y productos premium para el cuidado masculino",
      },
    ],
    stats: [
      { number: "150+", label: "Clientes Regulares" },
      { number: "6+", label: "Años de Experiencia" },
      { number: "8+", label: "Servicios" },
      { number: "100%", label: "Satisfacción" },
    ],
    testimonialsTitle: "Lo que dicen nuestros clientes",
    testimonialsSubtitle: "La opinión de quienes vuelven una y otra vez",
    testimonials: [
      {
        name: "Carlos Mendoza",
        text: "El mejor fade de la ciudad. Ambiente genial y siempre puntual.",
        rating: 5,
        service: "Corte Fade",
      },
      {
        name: "Miguel Torres",
        text: "Mi barbero de confianza. El afeitado con toalla caliente es increíble.",
        rating: 5,
        service: "Barba y Afeitado",
      },
    ],
    processTitle: "Tu visita",
    processSubtitle: "Simple, rápido y con resultados impecables",
    processSteps: [
      {
        title: "Reserva tu turno",
        description: "Agenda online y evita esperas",
      },
      {
        title: "Consulta de estilo",
        description: "Definimos juntos el corte o look que buscas",
      },
      {
        title: "Servicio de barbería",
        description: "Corte, barba o combo con técnicas profesionales",
      },
      {
        title: "Acabado perfecto",
        description: "Productos de styling y consejos de mantenimiento",
      },
    ],
    processCta: "¿Listo para tu próximo corte?",
    galleryTitle: "Nuestros Cortes",
    gallerySubtitle: "Estilos que hablan por sí solos",
    ctaTitle: "¿Listo para verte mejor?",
    ctaSubtitle: "Reserva tu turno y vive la experiencia barber",
    seoDescription:
      "Barbería profesional. Cortes clásicos, fade, barba y grooming masculino.",
  },
  contact: { hours: "Mar - Sáb: 9:00 AM - 8:00 PM" },
  social: {},
  defaultServices: [
    {
      nombre: "Corte Clásico",
      descripcion: "Corte tradicional con tijera y máquina, acabado impecable.",
      duracion: 30,
    },
    {
      nombre: "Fade / Degradado",
      descripcion: "Degradados precisos y estilos modernos.",
      duracion: 40,
    },
    {
      nombre: "Barba y Afeitado",
      descripcion: "Perfilado de barba, afeitado con navaja y toalla caliente.",
      duracion: 30,
    },
    {
      nombre: "Combo Corte + Barba",
      descripcion: "Servicio completo de corte y arreglo de barba.",
      duracion: 60,
    },
  ],
};

const tatuajesTemplate: BusinessTemplateConfig = {
  id: "tatuajes",
  nombre: "Tatuajes",
  descripcion: "Arte en la piel, diseños personalizados",
  icon: "🎨",
  branding: {
    primaryColor: "#0f172a",
    secondaryColor: "#dc2626",
    accentColor: "#f87171",
    heroImageUrl: getTemplateHeroUrl("tatuajes"),
  },
  content: {
    heroTitle: "Arte que",
    heroHighlight: "Perdura",
    heroSubtitle:
      "Diseños únicos, técnicas profesionales y un estudio donde tu visión cobra vida en la piel.",
    featuresTitle: "Nuestro estudio",
    featuresSubtitle: "Creatividad, higiene y profesionalismo",
    features: [
      {
        title: "Artistas Talentosos",
        description:
          "Tatuadores con estilos diversos y portafolio comprobado",
      },
      {
        title: "Higiene Certificada",
        description:
          "Protocolos estrictos de esterilización y materiales desechables",
      },
      {
        title: "Diseño Personalizado",
        description:
          "Creamos piezas únicas adaptadas a tu idea y anatomía",
      },
    ],
    stats: [
      { number: "500+", label: "Tatuajes Realizados" },
      { number: "8+", label: "Años de Experiencia" },
      { number: "4", label: "Artistas" },
      { number: "5★", label: "Valoración" },
    ],
    testimonialsTitle: "Lo que dicen nuestros clientes",
    testimonialsSubtitle: "Historias de arte en la piel",
    testimonials: [
      {
        name: "Diego Fernández",
        text: "Mi tatuaje quedó exactamente como lo imaginé. Increíble nivel de detalle.",
        rating: 5,
        service: "Realismo",
      },
      {
        name: "Valentina Cruz",
        text: "Ambiente profesional y cómodo. El proceso fue mucho mejor de lo esperado.",
        rating: 5,
        service: "Minimalista",
      },
    ],
    processTitle: "El proceso",
    processSubtitle: "De la idea al arte final en tu piel",
    processSteps: [
      {
        title: "Consulta inicial",
        description: "Conversamos sobre tu idea, tamaño y ubicación",
      },
      {
        title: "Diseño personalizado",
        description: "Creamos un boceto único y lo ajustamos contigo",
      },
      {
        title: "Sesión de tatuaje",
        description: "Ejecución profesional con materiales de primera",
      },
      {
        title: "Cuidados posteriores",
        description: "Te guiamos en el proceso de curación para el mejor resultado",
      },
    ],
    processCta: "¿Listo para tu próximo tatuaje?",
    galleryTitle: "Portafolio",
    gallerySubtitle: "Nuestros trabajos más recientes",
    ctaTitle: "¿Tienes una idea en mente?",
    ctaSubtitle: "Agenda una consulta y hagamos realidad tu diseño",
    seoDescription:
      "Estudio de tatuajes profesional. Diseños personalizados y artistas expertos.",
  },
  contact: { hours: "Mar - Sáb: 11:00 AM - 8:00 PM" },
  social: {},
  defaultServices: [
    {
      nombre: "Tatuaje Pequeño",
      descripcion: "Diseños minimalistas y piezas de hasta 10cm.",
      duracion: 60,
    },
    {
      nombre: "Tatuaje Mediano",
      descripcion: "Piezas de tamaño medio con detalle moderado.",
      duracion: 120,
    },
    {
      nombre: "Tatuaje Grande",
      descripcion: "Proyectos extensos, mangas y piezas de gran formato.",
      duracion: 240,
    },
    {
      nombre: "Consulta de Diseño",
      descripcion: "Sesión para planificar y bocetar tu tatuaje personalizado.",
      duracion: 30,
    },
  ],
};

const genericTemplate: BusinessTemplateConfig = {
  id: "generic",
  nombre: "Negocio General",
  descripcion: "Plantilla adaptable para cualquier negocio de turnos",
  icon: "🏪",
  branding: {
    primaryColor: "#0891b2",
    secondaryColor: "#0e7490",
    accentColor: "#67e8f9",
    heroImageUrl: getTemplateHeroUrl("generic"),
  },
  content: {
    heroTitle: "Bienvenido a",
    heroHighlight: "Tu Negocio",
    heroSubtitle:
      "Ofrecemos servicios de calidad con atención personalizada. Reserva tu cita de forma fácil y rápida.",
    featuresTitle: "¿Por qué elegirnos?",
    featuresSubtitle: "Compromiso con la excelencia",
    features: [
      {
        title: "Profesionales Calificados",
        description: "Equipo con experiencia y dedicación",
      },
      {
        title: "Atención Personalizada",
        description: "Cada cliente es único y merece lo mejor",
      },
      {
        title: "Reserva Fácil",
        description: "Agenda tu cita online en pocos pasos",
      },
    ],
    stats: [
      { number: "50+", label: "Clientes" },
      { number: "3+", label: "Años" },
      { number: "5+", label: "Servicios" },
      { number: "100%", label: "Compromiso" },
    ],
    testimonialsTitle: "Testimonios",
    testimonialsSubtitle: "Lo que dicen quienes nos visitan",
    testimonials: [
      {
        name: "Cliente Satisfecho",
        text: "Excelente servicio y muy profesionales. Totalmente recomendado.",
        rating: 5,
        service: "Servicio General",
      },
    ],
    processTitle: "Cómo funciona",
    processSubtitle: "Simple y eficiente",
    processSteps: [
      {
        title: "Reserva",
        description: "Elige fecha y hora en línea",
      },
      {
        title: "Confirmación",
        description: "Recibes confirmación de tu cita",
      },
      {
        title: "Atención",
        description: "Te atendemos con profesionalismo",
      },
      {
        title: "Satisfacción",
        description: "Sales satisfecho con el resultado",
      },
    ],
    processCta: "¿Listo para reservar?",
    galleryTitle: "Galería",
    gallerySubtitle: "Nuestro trabajo",
    ctaTitle: "Reserva tu cita",
    ctaSubtitle: "Estamos listos para atenderte",
    seoDescription: "Servicios profesionales con reserva online fácil.",
  },
  contact: { hours: "Lun - Vie: 9:00 AM - 6:00 PM" },
  social: {},
  defaultServices: [
    {
      nombre: "Servicio Básico",
      descripcion: "Servicio estándar de atención al cliente.",
      duracion: 30,
    },
    {
      nombre: "Servicio Premium",
      descripcion: "Servicio extendido con atención personalizada.",
      duracion: 60,
    },
  ],
};

export const BUSINESS_TEMPLATES: Record<BusinessTemplate, BusinessTemplateConfig> = {
  manicure: manicureTemplate,
  peluqueria: peluqueriaTemplate,
  barberia: barberiaTemplate,
  tatuajes: tatuajesTemplate,
  generic: genericTemplate,
};

export const BUSINESS_TEMPLATE_LIST = Object.values(BUSINESS_TEMPLATES);

export function getBusinessTemplate(
  template: BusinessTemplate
): BusinessTemplateConfig {
  return BUSINESS_TEMPLATES[template] || BUSINESS_TEMPLATES.generic;
}

export function isValidBusinessTemplate(
  value: string
): value is BusinessTemplate {
  return value in BUSINESS_TEMPLATES;
}

/** Merge template defaults with salon overrides */
export function mergeSalonCms(
  template: BusinessTemplate,
  branding?: Partial<SalonBranding>,
  content?: Partial<SalonContent>,
  contact?: Partial<SalonContact>,
  social?: Partial<SalonSocial>
) {
  const config = getBusinessTemplate(template);
  return {
    branding: { ...config.branding, ...branding },
    content: { ...config.content, ...content },
    contact: { ...config.contact, ...contact },
    social: { ...config.social, ...social },
  };
}

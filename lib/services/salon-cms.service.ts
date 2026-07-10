import { AppError } from "@/lib/api/errors";
import {
  getBusinessTemplate,
  isValidBusinessTemplate,
  mergeSalonCms,
} from "@/lib/business-templates";
import { salonRepository } from "@/lib/repositories/salon.repository";
import {
  BusinessTemplate,
  Salon,
  SalonCmsUpdateRequest,
  SalonDirectoryItem,
  SalonPublicProfile,
} from "@/lib/types";
import { DEFAULT_SALON_ID } from "@/lib/tenant";

function toPublicProfile(salon: Salon): SalonPublicProfile {
  const template = salon.businessTemplate || "manicure";
  const merged = mergeSalonCms(
    template,
    salon.branding,
    salon.content,
    salon.contact,
    salon.social
  );

  return {
    salonId: salon.salonId,
    slug: salon.slug,
    nombre: salon.nombre,
    whatsappNumber: salon.whatsappNumber,
    businessTemplate: template,
    branding: merged.branding,
    content: merged.content,
    contact: {
      ...merged.contact,
      phone: merged.contact.phone || salon.whatsappNumber,
    },
    social: {
      ...merged.social,
      whatsapp: merged.social.whatsapp || salon.whatsappNumber,
    },
  };
}

export class SalonCmsService {
  async getPublicBySlug(slug: string): Promise<SalonPublicProfile> {
    const salon = await salonRepository.findBySlug(slug);
    if (!salon || salon.status !== "active") {
      throw AppError.notFound("Salón no encontrado");
    }
    return toPublicProfile(salon);
  }

  async getPublicBySalonId(salonId: string): Promise<SalonPublicProfile> {
    const salon = await salonRepository.findBySalonId(salonId);
    if (!salon) {
      if (salonId === DEFAULT_SALON_ID) {
        return toPublicProfile({
          salonId: DEFAULT_SALON_ID,
          slug: "oh-diosa",
          nombre: "Oh`Diosa",
          status: "active",
          businessTemplate: "manicure",
        });
      }
      throw AppError.notFound("Salón no encontrado");
    }
    return toPublicProfile(salon);
  }

  async updateCms(
    salonId: string,
    data: SalonCmsUpdateRequest
  ): Promise<SalonPublicProfile> {
    const salon = await salonRepository.findBySalonId(salonId);
    if (!salon) throw AppError.notFound("Salón no encontrado");

    const updates: Partial<Salon> = {
      fechaActualizacion: new Date(),
    };

    if (data.nombre?.trim()) {
      updates.nombre = data.nombre.trim();
    }
    if (data.whatsappNumber !== undefined) {
      updates.whatsappNumber = data.whatsappNumber.trim() || undefined;
    }
    if (data.businessTemplate) {
      if (!isValidBusinessTemplate(data.businessTemplate)) {
        throw new AppError("Plantilla de negocio inválida", 400);
      }
      updates.businessTemplate = data.businessTemplate;
    }
    if (data.branding) {
      updates.branding = { ...salon.branding, ...data.branding };
    }
    if (data.content) {
      updates.content = { ...salon.content, ...data.content };
    }
    if (data.contact) {
      updates.contact = { ...salon.contact, ...data.contact };
    }
    if (data.social) {
      updates.social = { ...salon.social, ...data.social };
    }

    const updated = await salonRepository.updateBySalonId(salonId, updates);
    if (!updated) throw AppError.notFound("Salón no encontrado");
    return toPublicProfile(updated);
  }

  async applyTemplate(
    salonId: string,
    template: BusinessTemplate,
    resetContent = false
  ): Promise<SalonPublicProfile> {
    if (!isValidBusinessTemplate(template)) {
      throw new AppError("Plantilla de negocio inválida", 400);
    }

    const config = getBusinessTemplate(template);
    const updates: Partial<Salon> = {
      businessTemplate: template,
      fechaActualizacion: new Date(),
    };

    if (resetContent) {
      updates.branding = config.branding;
      updates.content = config.content;
      updates.contact = config.contact;
      updates.social = config.social;
    } else {
      const salon = await salonRepository.findBySalonId(salonId);
      if (!salon) throw AppError.notFound("Salón no encontrado");

      updates.branding = {
        ...salon.branding,
        primaryColor: config.branding.primaryColor,
        secondaryColor: config.branding.secondaryColor,
        accentColor: config.branding.accentColor,
      };
    }

    const updated = await salonRepository.updateBySalonId(salonId, updates);
    if (!updated) throw AppError.notFound("Salón no encontrado");
    return toPublicProfile(updated);
  }

  async listActiveDirectory(): Promise<SalonDirectoryItem[]> {
    const salons = await salonRepository.listActive();

    return salons.map((salon) => {
      const template = salon.businessTemplate || "generic";
      const merged = mergeSalonCms(
        template,
        salon.branding,
        salon.content,
        salon.contact,
        salon.social
      );

      return {
        slug: salon.slug,
        nombre: salon.nombre,
        businessTemplate: template,
        categoryLabel: getBusinessTemplate(template).nombre,
        subtitle: merged.content.heroSubtitle,
        logoUrl: merged.branding.logoSmallUrl || merged.branding.logoUrl,
        primaryColor: merged.branding.primaryColor || "#2563eb",
        secondaryColor: merged.branding.secondaryColor || "#7c3aed",
      };
    });
  }
}

export const salonCmsService = new SalonCmsService();

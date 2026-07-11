"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/design/PageHeader";
import SurfaceCard from "@/components/design/SurfaceCard";
import SegmentedControl from "@/components/design/dashboard/SegmentedControl";
import ColorField from "@/components/design/ColorField";
import { normalizeHexColor } from "@/lib/color-utils";
import {
  BusinessTemplate,
  SalonBranding,
  SalonContent,
  SalonContact,
  SalonSocial,
  SalonPublicProfile,
} from "@/lib/types";
import { preprocessImage, isValidImageFile, isValidFileSize } from "@/lib/imageUtils";

type Tab = "plantilla" | "marca" | "contenido" | "contacto";

interface TemplateOption {
  id: BusinessTemplate;
  nombre: string;
  descripcion: string;
  icon: string;
  particularidades: string[];
  branding: SalonBranding;
}

const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: "marca", label: "Marca" },
  { value: "contenido", label: "Contenido" },
  { value: "contacto", label: "Contacto" },
  { value: "plantilla", label: "Plantilla" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium">{children}</label>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`input-field ${className}`}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold tracking-tight sm:text-lg">{children}</h3>
  );
}

function normalizeBranding(branding: SalonBranding): SalonBranding {
  return {
    ...branding,
    primaryColor: normalizeHexColor(branding.primaryColor || "", "#2563eb"),
    secondaryColor: normalizeHexColor(branding.secondaryColor || "", "#7c3aed"),
    accentColor: normalizeHexColor(branding.accentColor || "", "#f43f5e"),
  };
}

export default function SitioAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>("marca");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [slug, setSlug] = useState("");
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  const [businessTemplate, setBusinessTemplate] = useState<BusinessTemplate>("generic");
  const [branding, setBranding] = useState<SalonBranding>({});
  const [content, setContent] = useState<SalonContent>({});
  const [contact, setContact] = useState<SalonContact>({});
  const [social, setSocial] = useState<SalonSocial>({});
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [salonRes, templatesRes] = await Promise.all([
        fetch("/api/salons/current"),
        fetch("/api/business-templates"),
      ]);
      const salonData = await salonRes.json();
      const templatesData = await templatesRes.json();

      if (templatesData.success) {
        setTemplates(templatesData.data);
      }

      if (salonData.success) {
        const cms: SalonPublicProfile = salonData.data.cms;
        setSlug(salonData.data.slug || cms.slug);
        setBusinessTemplate(cms.businessTemplate || "generic");
        setBranding(normalizeBranding(cms.branding || {}));
        setContent(cms.content || {});
        setContact(cms.contact || {});
        setSocial(cms.social || {});
        setWhatsappNumber(salonData.data.whatsappNumber || "");
      }
    } catch {
      setMessage("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const save = async (payload: Record<string, unknown>) => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/salons/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Cambios guardados");
        const cms = data.data as SalonPublicProfile;
        setBranding(normalizeBranding(cms.branding));
        setContent(cms.content);
        setContact(cms.contact);
        setSocial(cms.social);
        setBusinessTemplate(cms.businessTemplate);
      } else {
        setMessage(data.error || "Error al guardar");
      }
    } catch {
      setMessage("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = async (template: BusinessTemplate, resetContent: boolean) => {
    const templateName =
      templates.find((t) => t.id === template)?.nombre ?? "esta plantilla";

    if (resetContent) {
      if (
        !confirm(
          `¿Restablecer todo el contenido con los valores de "${templateName}"? Se perderán tus textos personalizados y se actualizarán los colores del sitio.`
        )
      ) {
        return;
      }
    } else if (
      !confirm(
        `¿Aplicar la paleta de colores de "${templateName}"? Se reemplazarán los colores principal, secundario y acento de tu sitio.`
      )
    ) {
      return;
    }

    await save({
      businessTemplate: template,
      applyTemplate: true,
      resetContent,
    });
    setBusinessTemplate(template);
  };

  const uploadLogo = async (file: File, field: "logoUrl" | "logoSmallUrl" | "heroImageUrl") => {
    if (!isValidImageFile(file) || !isValidFileSize(file)) {
      setMessage("Archivo de imagen inválido (máx 5MB)");
      return;
    }
    setSaving(true);
    try {
      const imageData = await preprocessImage(file);
      const uploadRes = await fetch("/api/imagenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: file.name,
          ...imageData,
        }),
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success && uploadData.data?.blobUrl) {
        const newBranding = { ...branding, [field]: uploadData.data.blobUrl };
        setBranding(newBranding);
        await save({ branding: normalizeBranding(newBranding) });
      } else {
        setMessage(uploadData.error || "Error al subir imagen");
      }
    } catch {
      setMessage("Error al subir imagen");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Mi sitio web"
        description="Personaliza la identidad y el contenido visible en tu landing."
        actions={
          slug ? (
            <Link
              href={`/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Ver sitio
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          ) : undefined
        }
      />

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message === "Cambios guardados"
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
          role="status"
        >
          {message}
        </div>
      )}

      <SegmentedControl value={activeTab} options={TAB_OPTIONS} onChange={setActiveTab} />

      {activeTab === "plantilla" && (
        <div className="space-y-4">
          <SurfaceCard className="border-primary/20 bg-primary/5">
            <div className="flex gap-3">
              <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 space-y-2 text-sm">
                <p className="font-medium">Cada plantilla va más allá de los colores</p>
                <p className="text-muted-foreground">
                  Además de la paleta, define textos de tu landing, el formulario de reservas,
                  mensajes de WhatsApp y servicios sugeridos. Revisa las particularidades de cada
                  una antes de aplicar cambios.
                </p>
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">Solo colores</span> — actualiza
                    la paleta sin tocar tus textos.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Restablecer todo</span> — aplica
                    textos, contacto y servicios sugeridos de la plantilla.
                  </li>
                </ul>
              </div>
            </div>
          </SurfaceCard>

          <p className="text-sm text-muted-foreground">
            Elige la plantilla que mejor encaje con tu negocio. La activa aparece resaltada.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {templates.map((t) => (
              <SurfaceCard
                key={t.id}
                className={
                  businessTemplate === t.id ? "border-primary ring-1 ring-primary/20" : ""
                }
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden>
                    {t.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{t.nombre}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{t.descripcion}</p>
                    {t.particularidades.length > 0 && (
                      <ul className="mt-2.5 space-y-1 border-t border-border/60 pt-2.5">
                        {t.particularidades.map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-xs text-muted-foreground"
                          >
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/70" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2 flex gap-1">
                      <div
                        className="size-5 rounded-full border border-border"
                        style={{ background: t.branding.primaryColor }}
                      />
                      <div
                        className="size-5 rounded-full border border-border"
                        style={{ background: t.branding.secondaryColor }}
                      />
                      <div
                        className="size-5 rounded-full border border-border"
                        style={{ background: t.branding.accentColor }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outlined-secondary"
                        onClick={() => applyTemplate(t.id, false)}
                        disabled={saving}
                      >
                        Solo colores
                      </Button>
                      <Button
                        size="sm"
                        variant="outlined-primary"
                        onClick={() => applyTemplate(t.id, true)}
                        disabled={saving}
                      >
                        Restablecer todo
                      </Button>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === "marca" && (
        <div className="space-y-6">
          <SurfaceCard>
            <SectionTitle>Imágenes de marca</SectionTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              El logo pequeño aparece en el header; la imagen hero cubre la sección principal.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(["logoUrl", "logoSmallUrl", "heroImageUrl"] as const).map((field) => (
                <div key={field} className="rounded-lg border border-border bg-muted/30 p-3">
                  <FieldLabel>
                    {field === "logoUrl"
                      ? "Logo principal"
                      : field === "logoSmallUrl"
                        ? "Logo pequeño (header)"
                        : "Imagen hero"}
                  </FieldLabel>
                  {branding[field] && (
                    <div className="relative mb-2 h-24 w-full overflow-hidden rounded-lg bg-muted">
                      <Image src={branding[field]!} alt="" fill className="object-contain" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], field)}
                    className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground"
                  />
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionTitle>Paleta de colores</SectionTitle>
            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <ColorField
                label="Color principal"
                description="Botones, enlaces y acentos principales"
                value={branding.primaryColor || ""}
                onChange={(v) => setBranding({ ...branding, primaryColor: v })}
                fallback="#2563eb"
              />
              <ColorField
                label="Color secundario"
                description="Gradientes y fondos del hero"
                value={branding.secondaryColor || ""}
                onChange={(v) => setBranding({ ...branding, secondaryColor: v })}
                fallback="#7c3aed"
              />
              <ColorField
                label="Color acento"
                description="Detalles y elementos decorativos"
                value={branding.accentColor || ""}
                onChange={(v) => setBranding({ ...branding, accentColor: v })}
                fallback="#f43f5e"
              />
            </div>
          </SurfaceCard>

          <Button
            onClick={() => save({ branding: normalizeBranding(branding), whatsappNumber })}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar marca"}
          </Button>
        </div>
      )}

      {activeTab === "contenido" && (
        <div className="space-y-6">
          <SurfaceCard className="space-y-4">
            <SectionTitle>Hero</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Título</FieldLabel>
                <TextInput
                  value={content.heroTitle || ""}
                  onChange={(v) => setContent({ ...content, heroTitle: v })}
                />
              </div>
              <div>
                <FieldLabel>Destacado</FieldLabel>
                <TextInput
                  value={content.heroHighlight || ""}
                  onChange={(v) => setContent({ ...content, heroHighlight: v })}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Subtítulo</FieldLabel>
              <textarea
                value={content.heroSubtitle || ""}
                onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                rows={3}
                className="input-field min-h-[88px] resize-y"
              />
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <SectionTitle>Beneficios</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Título de sección</FieldLabel>
                <TextInput
                  value={content.featuresTitle || ""}
                  onChange={(v) => setContent({ ...content, featuresTitle: v })}
                  placeholder="¿Por qué elegirnos?"
                />
              </div>
              <div>
                <FieldLabel>Subtítulo</FieldLabel>
                <TextInput
                  value={content.featuresSubtitle || ""}
                  onChange={(v) => setContent({ ...content, featuresSubtitle: v })}
                />
              </div>
            </div>
            {(content.features || []).map((feature, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
                <input
                  value={feature.title}
                  onChange={(e) => {
                    const features = [...(content.features || [])];
                    features[i] = { ...features[i], title: e.target.value };
                    setContent({ ...content, features });
                  }}
                  placeholder="Título del beneficio"
                  className="input-field"
                />
                <input
                  value={feature.description}
                  onChange={(e) => {
                    const features = [...(content.features || [])];
                    features[i] = { ...features[i], description: e.target.value };
                    setContent({ ...content, features });
                  }}
                  placeholder="Descripción"
                  className="input-field"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setContent({
                  ...content,
                  features: [...(content.features || []), { title: "", description: "" }],
                })
              }
              className="text-sm font-medium text-primary hover:underline"
            >
              + Agregar beneficio
            </button>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <SectionTitle>Estadísticas</SectionTitle>
            {(content.stats || []).map((stat, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={stat.number}
                  onChange={(e) => {
                    const stats = [...(content.stats || [])];
                    stats[i] = { ...stats[i], number: e.target.value };
                    setContent({ ...content, stats });
                  }}
                  placeholder="Número"
                  className="input-field w-28"
                />
                <input
                  value={stat.label}
                  onChange={(e) => {
                    const stats = [...(content.stats || [])];
                    stats[i] = { ...stats[i], label: e.target.value };
                    setContent({ ...content, stats });
                  }}
                  placeholder="Etiqueta"
                  className="input-field flex-1"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setContent({ ...content, stats: [...(content.stats || []), { number: "", label: "" }] })
              }
              className="text-sm font-medium text-primary hover:underline"
            >
              + Agregar estadística
            </button>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Título galería</FieldLabel>
                <TextInput
                  value={content.galleryTitle || ""}
                  onChange={(v) => setContent({ ...content, galleryTitle: v })}
                  placeholder="Nuestros Trabajos"
                />
              </div>
              <div>
                <FieldLabel>Subtítulo galería</FieldLabel>
                <TextInput
                  value={content.gallerySubtitle || ""}
                  onChange={(v) => setContent({ ...content, gallerySubtitle: v })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Las imágenes de la galería se gestionan en{" "}
              <Link href="/admin/contenido" className="font-medium text-primary hover:underline">
                Contenido
              </Link>
              , marcando &quot;Nuestros Trabajos&quot; en cada imagen.
            </p>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Título testimonios</FieldLabel>
                <TextInput
                  value={content.testimonialsTitle || ""}
                  onChange={(v) => setContent({ ...content, testimonialsTitle: v })}
                />
              </div>
              <div>
                <FieldLabel>Subtítulo testimonios</FieldLabel>
                <TextInput
                  value={content.testimonialsSubtitle || ""}
                  onChange={(v) => setContent({ ...content, testimonialsSubtitle: v })}
                />
              </div>
            </div>
            {(content.testimonials || []).map((t, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                <TextInput
                  value={t.name}
                  onChange={(v) => {
                    const testimonials = [...(content.testimonials || [])];
                    testimonials[i] = { ...testimonials[i], name: v };
                    setContent({ ...content, testimonials });
                  }}
                  placeholder="Nombre"
                />
                <textarea
                  value={t.text}
                  onChange={(e) => {
                    const testimonials = [...(content.testimonials || [])];
                    testimonials[i] = { ...testimonials[i], text: e.target.value };
                    setContent({ ...content, testimonials });
                  }}
                  placeholder="Testimonio"
                  rows={2}
                  className="input-field min-h-[72px] resize-y"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setContent({
                  ...content,
                  testimonials: [...(content.testimonials || []), { name: "", text: "", rating: 5 }],
                })
              }
              className="text-sm font-medium text-primary hover:underline"
            >
              + Agregar testimonio
            </button>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <SectionTitle>Proceso</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Título</FieldLabel>
                <TextInput
                  value={content.processTitle || ""}
                  onChange={(v) => setContent({ ...content, processTitle: v })}
                />
              </div>
              <div>
                <FieldLabel>Subtítulo</FieldLabel>
                <TextInput
                  value={content.processSubtitle || ""}
                  onChange={(v) => setContent({ ...content, processSubtitle: v })}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Texto del botón</FieldLabel>
              <TextInput
                value={content.processCta || ""}
                onChange={(v) => setContent({ ...content, processCta: v })}
                placeholder="Reservar cita"
              />
            </div>
            {(content.processSteps || []).map((step, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
                <input
                  value={step.title}
                  onChange={(e) => {
                    const processSteps = [...(content.processSteps || [])];
                    processSteps[i] = { ...processSteps[i], title: e.target.value };
                    setContent({ ...content, processSteps });
                  }}
                  placeholder="Paso"
                  className="input-field"
                />
                <input
                  value={step.description}
                  onChange={(e) => {
                    const processSteps = [...(content.processSteps || [])];
                    processSteps[i] = { ...processSteps[i], description: e.target.value };
                    setContent({ ...content, processSteps });
                  }}
                  placeholder="Descripción"
                  className="input-field"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setContent({
                  ...content,
                  processSteps: [...(content.processSteps || []), { title: "", description: "" }],
                })
              }
              className="text-sm font-medium text-primary hover:underline"
            >
              + Agregar paso
            </button>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <SectionTitle>Llamada a la acción final</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Título</FieldLabel>
                <TextInput
                  value={content.ctaTitle || ""}
                  onChange={(v) => setContent({ ...content, ctaTitle: v })}
                />
              </div>
              <div>
                <FieldLabel>Subtítulo</FieldLabel>
                <TextInput
                  value={content.ctaSubtitle || ""}
                  onChange={(v) => setContent({ ...content, ctaSubtitle: v })}
                />
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-4">
            <SectionTitle>SEO</SectionTitle>
            <TextInput
              value={content.seoTitle || ""}
              onChange={(v) => setContent({ ...content, seoTitle: v })}
              placeholder="Título SEO"
            />
            <textarea
              value={content.seoDescription || ""}
              onChange={(e) => setContent({ ...content, seoDescription: e.target.value })}
              placeholder="Descripción SEO"
              rows={2}
              className="input-field min-h-[72px] resize-y"
            />
          </SurfaceCard>

          <Button onClick={() => save({ content })} disabled={saving}>
            {saving ? "Guardando..." : "Guardar contenido"}
          </Button>
        </div>
      )}

      {activeTab === "contacto" && (
        <SurfaceCard className="space-y-4">
          <SectionTitle>Contacto y redes</SectionTitle>
          <div>
            <FieldLabel>WhatsApp / Teléfono principal</FieldLabel>
            <TextInput
              value={whatsappNumber}
              onChange={setWhatsappNumber}
              placeholder="+53..."
            />
          </div>
          <div>
            <FieldLabel>Teléfono en la landing</FieldLabel>
            <TextInput
              value={contact.phone || ""}
              onChange={(v) => setContact({ ...contact, phone: v })}
              placeholder="Opcional si difiere del WhatsApp"
            />
          </div>
          <div>
            <FieldLabel>Dirección</FieldLabel>
            <TextInput
              value={contact.address || ""}
              onChange={(v) => setContact({ ...contact, address: v })}
            />
          </div>
          <div>
            <FieldLabel>URL de mapa (Google Maps)</FieldLabel>
            <TextInput
              value={contact.addressUrl || ""}
              onChange={(v) => setContact({ ...contact, addressUrl: v })}
            />
          </div>
          <div>
            <FieldLabel>Horarios</FieldLabel>
            <TextInput
              value={contact.hours || ""}
              onChange={(v) => setContact({ ...contact, hours: v })}
              placeholder="Lun - Vie: 9:00 AM - 6:00 PM"
            />
          </div>
          <div>
            <FieldLabel>Facebook</FieldLabel>
            <TextInput
              value={social.facebook || ""}
              onChange={(v) => setSocial({ ...social, facebook: v })}
            />
          </div>
          <div>
            <FieldLabel>Instagram</FieldLabel>
            <TextInput
              value={social.instagram || ""}
              onChange={(v) => setSocial({ ...social, instagram: v })}
            />
          </div>
          <Button
            onClick={() => save({ contact, social, whatsappNumber })}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar contacto"}
          </Button>
        </SurfaceCard>
      )}
    </div>
  );
}

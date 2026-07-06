"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
  branding: SalonBranding;
}

export default function SitioAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>("plantilla");
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
        setBranding(cms.branding || {});
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
        setMessage("✓ Cambios guardados");
        const cms = data.data as SalonPublicProfile;
        setBranding(cms.branding);
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
    if (resetContent && !confirm("¿Restablecer todo el contenido con los valores de la plantilla? Se perderán tus textos personalizados.")) {
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
        await save({ branding: newBranding });
      } else {
        setMessage(uploadData.error || "Error al subir imagen");
      }
    } catch {
      setMessage("Error al subir imagen");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "plantilla", label: "Plantilla" },
    { id: "marca", label: "Marca" },
    { id: "contenido", label: "Contenido" },
    { id: "contacto", label: "Contacto" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mi Sitio Web
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Personaliza la identidad y contenido de tu negocio
          </p>
        </div>
        {slug && (
          <Link
            href={`/${slug}`}
            target="_blank"
            className="text-sm text-blue-600 hover:underline"
          >
            Ver sitio → /{slug}
          </Link>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.startsWith("✓") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plantilla */}
      {activeTab === "plantilla" && (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Elige una plantilla según tu tipo de negocio. Puedes aplicar solo los colores o restablecer todo el contenido.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div
                key={t.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  businessTemplate === t.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{t.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t.descripcion}</p>
                    <div className="flex gap-1 mt-2">
                      <div className="w-5 h-5 rounded-full" style={{ background: t.branding.primaryColor }} />
                      <div className="w-5 h-5 rounded-full" style={{ background: t.branding.secondaryColor }} />
                      <div className="w-5 h-5 rounded-full" style={{ background: t.branding.accentColor }} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => applyTemplate(t.id, false)}
                        disabled={saving}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
                      >
                        Solo colores
                      </button>
                      <button
                        onClick={() => applyTemplate(t.id, true)}
                        disabled={saving}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Restablecer todo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marca */}
      {activeTab === "marca" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["logoUrl", "logoSmallUrl", "heroImageUrl"] as const).map((field) => (
              <div key={field} className="p-4 border rounded-xl dark:border-gray-700">
                <label className="text-sm font-medium block mb-2">
                  {field === "logoUrl" ? "Logo principal" : field === "logoSmallUrl" ? "Logo pequeño (header)" : "Imagen hero"}
                </label>
                {branding[field] && (
                  <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden bg-gray-100">
                    <Image src={branding[field]!} alt="" fill className="object-contain" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], field)}
                  className="text-xs w-full"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["primaryColor", "secondaryColor", "accentColor"] as const).map((field) => (
              <div key={field}>
                <label className="text-sm font-medium block mb-1">
                  {field === "primaryColor" ? "Color principal" : field === "secondaryColor" ? "Color secundario" : "Color acento"}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={branding[field] || "#2563eb"}
                    onChange={(e) => setBranding({ ...branding, [field]: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding[field] || ""}
                    onChange={(e) => setBranding({ ...branding, [field]: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => save({ branding, whatsappNumber })}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar marca"}
          </Button>
        </div>
      )}

      {/* Contenido */}
      {activeTab === "contenido" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Hero</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm block mb-1">Título</label>
                <input
                  value={content.heroTitle || ""}
                  onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Destacado</label>
                <input
                  value={content.heroHighlight || ""}
                  onChange={(e) => setContent({ ...content, heroHighlight: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1">Subtítulo</label>
              <textarea
                value={content.heroSubtitle || ""}
                onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Estadísticas</h3>
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
                  className="w-24 px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <input
                  value={stat.label}
                  onChange={(e) => {
                    const stats = [...(content.stats || [])];
                    stats[i] = { ...stats[i], label: e.target.value };
                    setContent({ ...content, stats });
                  }}
                  placeholder="Etiqueta"
                  className="flex-1 px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
            ))}
            <button
              onClick={() => setContent({ ...content, stats: [...(content.stats || []), { number: "", label: "" }] })}
              className="text-sm text-blue-600"
            >
              + Agregar estadística
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Testimonios</h3>
            {(content.testimonials || []).map((t, i) => (
              <div key={i} className="p-3 border rounded-lg dark:border-gray-700 space-y-2">
                <input
                  value={t.name}
                  onChange={(e) => {
                    const testimonials = [...(content.testimonials || [])];
                    testimonials[i] = { ...testimonials[i], name: e.target.value };
                    setContent({ ...content, testimonials });
                  }}
                  placeholder="Nombre"
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
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
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                />
              </div>
            ))}
            <button
              onClick={() =>
                setContent({
                  ...content,
                  testimonials: [...(content.testimonials || []), { name: "", text: "", rating: 5 }],
                })
              }
              className="text-sm text-blue-600"
            >
              + Agregar testimonio
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">SEO</h3>
            <input
              value={content.seoTitle || ""}
              onChange={(e) => setContent({ ...content, seoTitle: e.target.value })}
              placeholder="Título SEO"
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <textarea
              value={content.seoDescription || ""}
              onChange={(e) => setContent({ ...content, seoDescription: e.target.value })}
              placeholder="Descripción SEO"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>

          <Button onClick={() => save({ content })} disabled={saving}>
            {saving ? "Guardando..." : "Guardar contenido"}
          </Button>
        </div>
      )}

      {/* Contacto */}
      {activeTab === "contacto" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm block mb-1">WhatsApp / Teléfono</label>
            <input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+53..."
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Dirección</label>
            <input
              value={contact.address || ""}
              onChange={(e) => setContact({ ...contact, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">URL de mapa (Google Maps)</label>
            <input
              value={contact.addressUrl || ""}
              onChange={(e) => setContact({ ...contact, addressUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Horarios</label>
            <input
              value={contact.hours || ""}
              onChange={(e) => setContact({ ...contact, hours: e.target.value })}
              placeholder="Lun - Vie: 9:00 AM - 6:00 PM"
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Facebook</label>
            <input
              value={social.facebook || ""}
              onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">Instagram</label>
            <input
              value={social.instagram || ""}
              onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
            />
          </div>
          <Button
            onClick={() => save({ contact, social, whatsappNumber })}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar contacto"}
          </Button>
        </div>
      )}
    </div>
  );
}

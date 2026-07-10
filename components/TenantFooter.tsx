import Link from "next/link";
import Image from "next/image";
import {
  Clock3,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SalonPublicProfile, SalonSocial } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TenantFooterProps {
  profile: Pick<
    SalonPublicProfile,
    "slug" | "nombre" | "branding" | "contact" | "social" | "whatsappNumber"
  >;
  reservaPath: string;
  tagline?: string;
  className?: string;
}

function SocialIconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/85 transition-colors hover:border-primary/40 hover:bg-primary/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[oklch(0.16_0.018_260)]"
    >
      {children}
    </a>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-white/70 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}

function ContactItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-primary">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-white/80">{children}</div>
      </div>
    </div>
  );
}

export default function TenantFooter({
  profile,
  reservaPath,
  tagline,
  className,
}: TenantFooterProps) {
  const { branding, contact, social } = profile;
  const basePath = `/${profile.slug}`;
  const logoUrl = branding.logoSmallUrl || branding.logoUrl;
  const whatsapp =
    social.whatsapp || profile.whatsappNumber || contact.phone || "";
  const whatsappLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, "")}`
    : null;

  const socialLinks = buildSocialLinks(social, whatsappLink);
  const navLinks = [
    { href: `${basePath}#servicios`, label: "Servicios" },
    { href: `${basePath}#galeria`, label: "Galería" },
    { href: `${basePath}#contacto`, label: "Contacto" },
    { href: reservaPath, label: "Reservar cita" },
  ];

  return (
    <>
      <div
        className="h-10 bg-gradient-to-b from-card to-[oklch(0.16_0.018_260)]"
        aria-hidden
      />
      <footer className={cn("tenant-footer", className)}>
        <div className="tenant-footer-accent" aria-hidden />

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10">
            {/* Brand */}
            <div className="lg:col-span-4">
              <div className="flex items-start gap-4">
                {logoUrl ? (
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2 sm:size-[4.5rem]">
                    <Image
                      src={logoUrl}
                      alt={`${profile.nombre} logo`}
                      fill
                      className="object-contain p-1"
                      sizes="72px"
                    />
                  </div>
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground sm:size-[4.5rem]">
                    {profile.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 pt-0.5">
                  <p className="text-lg font-bold tracking-tight sm:text-xl">
                    {profile.nombre}
                  </p>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-white/65">
                    {tagline ||
                      "Cuidado profesional de uñas con atención personalizada."}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="md:col-span-1 lg:col-span-2">
              <p className="footer-heading">Explorar</p>
              <ul className="mt-4 space-y-2.5">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-1 lg:col-span-3">
              <p className="footer-heading">Visítanos</p>
              <div className="mt-4 space-y-4">
                {contact.address && (
                  <ContactItem icon={MapPin} label="Dirección">
                    {contact.addressUrl ? (
                      <a
                        href={contact.addressUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white"
                      >
                        {contact.address}
                      </a>
                    ) : (
                      <span>{contact.address}</span>
                    )}
                  </ContactItem>
                )}
                {(contact.phone || whatsapp) && whatsappLink && (
                  <ContactItem icon={Phone} label="Teléfono">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                      {contact.phone || whatsapp}
                    </a>
                  </ContactItem>
                )}
                {contact.hours && (
                  <ContactItem icon={Clock3} label="Horarios">
                    <span>{contact.hours}</span>
                  </ContactItem>
                )}
              </div>
            </div>

            {/* Social + CTA */}
            <div className="lg:col-span-3">
              <p className="footer-heading">Conecta</p>
              {socialLinks.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {socialLinks.map((item) => (
                    <SocialIconButton
                      key={item.label}
                      href={item.href}
                      label={item.label}
                    >
                      {item.icon}
                    </SocialIconButton>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/55">
                  Síguenos para ver nuestros últimos diseños.
                </p>
              )}

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">¿Lista para tu cita?</p>
                    <p className="mt-1 text-xs text-white/60">
                      Reserva en minutos y te confirmamos por WhatsApp.
                    </p>
                  </div>
                </div>
                <Link href={reservaPath} className="mt-4 block">
                  <Button variant="primary" size="sm" fullWidth>
                    Reservar ahora
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-xs text-white/50 sm:text-left sm:text-sm">
              &copy; {new Date().getFullYear()} {profile.nombre}. Todos los
              derechos reservados.
            </p>
            <p className="text-center text-xs text-white/40 sm:text-right">
              Reservas con{" "}
              <Link href="/" className="text-white/60 hover:text-white">
                ReservaSalón
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

function buildSocialLinks(
  social: SalonSocial,
  whatsappLink: string | null
): { href: string; label: string; icon: React.ReactNode }[] {
  const links: { href: string; label: string; icon: React.ReactNode }[] = [];

  if (social.instagram) {
    links.push({
      href: social.instagram,
      label: "Instagram",
      icon: (
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    });
  }

  if (whatsappLink) {
    links.push({
      href: whatsappLink,
      label: "WhatsApp",
      icon: (
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      ),
    });
  }

  if (social.facebook) {
    links.push({
      href: social.facebook,
      label: "Facebook",
      icon: (
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      ),
    });
  }

  if (social.tiktok) {
    links.push({
      href: social.tiktok,
      label: "TikTok",
      icon: (
        <svg className="size-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 0012.68 0V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
        </svg>
      ),
    });
  }

  return links;
}

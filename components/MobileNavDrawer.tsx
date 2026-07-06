"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";

export interface MobileNavLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface MobileNavCta {
  href: string;
  label: string;
  style?: React.CSSProperties;
  className?: string;
}

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  links?: MobileNavLink[];
  cta?: MobileNavCta;
  title?: string;
  accentColor?: string;
  children?: React.ReactNode;
  /** When "all", drawer is available on desktop too (e.g. admin panel) */
  visibility?: "mobile" | "all";
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  links = [],
  cta,
  title = "Menú",
  accentColor,
  children,
  visibility = "mobile",
}: MobileNavDrawerProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleEscape]);

  const accentStyle = accentColor
    ? ({ "--mobile-nav-accent": accentColor } as React.CSSProperties)
    : undefined;

  const hideOnDesktop = visibility === "mobile";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          hideOnDesktop ? "md:hidden" : ""
        } ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-[min(100vw,340px)] flex flex-col glass-strong shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          hideOnDesktop ? "md:hidden" : ""
        } ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={accentStyle}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!isOpen}
      >
        {/* Decorative gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400"
          style={
            accentColor
              ? {
                  background: `linear-gradient(to right, ${accentColor}, ${accentColor}99)`,
                }
              : undefined
          }
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-gray-200/60 dark:border-white/10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            aria-label="Cerrar menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation content */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 hide-scrollbar">
          {children ? (
            <div className="space-y-2">{children}</div>
          ) : (
            <ul className="space-y-1.5">
              {links.map((link, index) => (
                <li
                  key={link.href}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${index * 60 + 80}ms`, animationFillMode: "both" }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/25 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 active:scale-[0.98]"
                  >
                    {link.icon && (
                      <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                        {link.icon}
                      </span>
                    )}
                    <span className="text-base">{link.label}</span>
                    <svg
                      className="w-4 h-4 ml-auto opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-200 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {/* CTA footer */}
        {cta && (
          <div className="p-4 pt-2 border-t border-gray-200/60 dark:border-white/10 safe-area-bottom">
            <Link
              href={cta.href}
              onClick={onClose}
              className={
                cta.className ??
                "flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full text-white font-semibold text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]"
              }
              style={cta.style}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              {cta.label}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

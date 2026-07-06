'use client';

import { useState, useEffect } from 'react';
import { SalonTestimonial } from '@/lib/types';

const DEFAULT_TESTIMONIALS: SalonTestimonial[] = [
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
];

interface TestimonialCarouselProps {
  testimonials?: SalonTestimonial[];
  title?: string;
  subtitle?: string;
  primaryColor?: string;
}

export default function TestimonialCarousel({
  testimonials = DEFAULT_TESTIMONIALS,
  title = "Lo que dicen nuestras clientes",
  subtitle = "Testimonios reales de clientas satisfechas",
  primaryColor,
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  const current = testimonials[currentIndex];
  const dotColor = primaryColor || undefined;

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        <div className="relative">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-gray-100 dark:border-gray-700">
            <div className="mb-4 sm:mb-6 flex justify-center gap-1">
              {[...Array(current.rating)].map((_, i) => (
                <svg key={i} className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>

            <blockquote className="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 italic leading-relaxed">
              &ldquo;{current.text}&rdquo;
            </blockquote>

            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white mb-3 sm:mb-4 ${!primaryColor ? "bg-gradient-to-r from-blue-500 to-violet-500" : ""}`}
                style={primaryColor ? { background: primaryColor } : undefined}
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <cite className="font-semibold text-gray-900 dark:text-white not-italic text-sm sm:text-base">
                {current.name}
              </cite>
              {current.service && (
                <p className="text-xs sm:text-sm mt-1" style={dotColor ? { color: dotColor } : undefined}>
                  Servicio: {current.service}
                </p>
              )}
            </div>
          </div>

          {testimonials.length > 1 && (
            <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
                    index === currentIndex
                      ? primaryColor ? "" : "bg-blue-600 dark:bg-blue-500"
                      : "bg-blue-300 dark:bg-blue-600 hover:bg-blue-400"
                  }`}
                  style={index === currentIndex && primaryColor ? { background: primaryColor } : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect } from 'react';

const testimonials = [
  {
    name: "María González",
    text: "El mejor salón de uñas de la ciudad. Siempre salgo encantada con mis diseños.",
    rating: 5,
    service: "Nail Art"
  },
  {
    name: "Ana Rodríguez",
    text: "Profesionales increíbles, productos de calidad y un ambiente muy relajante.",
    rating: 5,
    service: "Spa de Manos"
  },
  {
    name: "Carmen López",
    text: "Las extensiones me duran perfectas por semanas. Totalmente recomendado.",
    rating: 5,
    service: "Gel/Acrílico"
  }
];

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Lo que dicen nuestras clientes
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            Testimonios reales de clientas satisfechas
          </p>
        </div>

        <div className="relative">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl dark:shadow-gray-900/20 p-6 sm:p-8 text-center border border-gray-100 dark:border-gray-700">
            <div className="mb-4 sm:mb-6">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-xl sm:text-2xl">
                  ⭐
                </span>
              ))}
            </div>

            <blockquote className="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 italic leading-relaxed">
              "{testimonials[currentIndex].text}"
            </blockquote>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-violet-500 dark:from-blue-400 dark:to-violet-400 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl mb-3 sm:mb-4">
                👤
              </div>
              <cite className="font-semibold text-gray-900 dark:text-white not-italic text-sm sm:text-base">
                {testimonials[currentIndex].name}
              </cite>
              <p className="text-blue-700 dark:text-blue-400 text-xs sm:text-sm mt-1">
                Servicio: {testimonials[currentIndex].service}
              </p>
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
                  index === currentIndex ?
                    "bg-blue-600 dark:bg-blue-500"
                  : "bg-blue-300 dark:bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

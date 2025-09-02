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
    <section className="py-20 bg-gradient-to-r from-blue-50 to-violet-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Lo que dicen nuestras clientes</h2>
          <p className="text-gray-700">Testimonios reales de clientas satisfechas</p>
        </div>

        <div className="relative">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-2xl">⭐</span>
              ))}
            </div>
            
            <blockquote className="text-xl text-gray-700 mb-6 italic">
              "{testimonials[currentIndex].text}"
            </blockquote>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white text-2xl mb-4">
                👤
              </div>
              <cite className="font-semibold text-gray-900 not-italic">
                {testimonials[currentIndex].name}
              </cite>
              <p className="text-blue-700 text-sm">
                Servicio: {testimonials[currentIndex].service}
              </p>
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-blue-600'
                    : 'bg-blue-300 hover:bg-blue-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

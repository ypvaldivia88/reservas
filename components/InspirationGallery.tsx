export default function InspirationGallery() {
  const inspirations = [
    {
      category: "Clásico",
      designs: [
        { name: "Francés Tradicional", color: "bg-gradient-to-t from-blue-100 to-white", popular: true },
        { name: "Nude Elegante", color: "bg-gradient-to-t from-violet-100 to-blue-50", popular: false },
        { name: "Rojo Glamour", color: "bg-gradient-to-t from-red-400 to-red-300", popular: true },
      ]
    },
    {
      category: "Moderno", 
      designs: [
        { name: "Ombré Suave", color: "bg-gradient-to-t from-purple-300 to-blue-200", popular: true },
        { name: "Metálico", color: "bg-gradient-to-t from-yellow-300 to-yellow-200", popular: false },
        { name: "Mate Oscuro", color: "bg-gradient-to-t from-gray-600 to-gray-500", popular: true },
      ]
    },
    {
      category: "Nail Art",
      designs: [
        { name: "Flores Delicadas", color: "bg-gradient-to-t from-green-200 to-white", popular: true },
        { name: "Geométrico", color: "bg-gradient-to-t from-blue-300 to-white", popular: false },
        { name: "Brillos y Cristales", color: "bg-gradient-to-t from-purple-200 to-white", popular: true },
      ]
    }
  ];

  return (
    <section className="py-12 sm:py-14 lg:py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Galería de Inspiración
          </h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
            Explora nuestros diseños más populares y encuentra la inspiración
            para tu próxima manicure
          </p>
        </div>

        <div className="space-y-8 sm:space-y-10 lg:space-y-12">
          {inspirations.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
                {category.category}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {category.designs.map((design, designIndex) => (
                  <div
                    key={designIndex}
                    className="group relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/30 transition-all duration-300 border border-gray-100 dark:border-gray-700"
                  >
                    {/* Popular badge */}
                    {design.popular && (
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
                        <span className="bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-500 dark:to-violet-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                          ⭐ Popular
                        </span>
                      </div>
                    )}

                    {/* Design preview */}
                    <div className="aspect-square p-6 sm:p-8">
                      <div className="h-full flex items-center justify-center">
                        {/* Nail shape representation */}
                        <div className="relative">
                          <div
                            className={`w-12 sm:w-16 h-16 sm:h-20 ${design.color} rounded-full shadow-lg transform rotate-12 hover:rotate-6 transition-transform duration-300`}
                          ></div>
                          <div
                            className={`w-12 sm:w-16 h-16 sm:h-20 ${design.color} rounded-full shadow-lg transform -rotate-12 hover:-rotate-6 transition-transform duration-300 absolute -right-3 sm:-right-4 top-0`}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl sm:text-2xl">💅</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Design info */}
                    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-700/50">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
                        {design.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                        Perfecto para{" "}
                        {category.category.toLowerCase() === "clásico" ?
                          "ocasiones elegantes"
                        : category.category.toLowerCase() === "moderno" ?
                          "looks contemporáneos"
                        : "expresar tu creatividad"}
                      </p>

                      <button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-500 dark:to-violet-500 text-white py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-400/25 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300">
                        Elegir este diseño
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-8 sm:mt-10 lg:mt-12">
          <div className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto border border-blue-100 dark:border-blue-800">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              ¿No encuentras lo que buscas?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Nuestras artistas pueden crear cualquier diseño que tengas en
              mente. Trae tu inspiración o déjanos sorprenderte con algo único.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-500 dark:to-violet-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-400/25 transition-all transform hover:-translate-y-0.5 text-sm sm:text-base">
                📱 Enviar Referencia por WhatsApp
              </button>
              <button className="border-2 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-sm sm:text-base">
                💬 Consultar Diseño Personalizado
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

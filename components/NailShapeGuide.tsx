export default function NailShapeGuide() {
  const shapes = [
    {
      name: "Coffin",
      description: "Elegante y moderna con punta suave",
      icon: "⚰️",
      characteristics: ["Alarga los dedos", "Ideal para nail art", "Muy trendy"],
      difficulty: "Media"
    },
    {
      name: "Almond", 
      description: "Ovalada puntiaguda que estiliza",
      icon: "🌰",
      characteristics: ["Muy favorecedora", "Clásica y elegante", "Fácil mantenimiento"],
      difficulty: "Fácil"
    },
    {
      name: "Stiletto",
      description: "Dramática y llamativa",
      icon: "🔺", 
      characteristics: ["Muy puntiaguda", "Para ocasiones especiales", "Requiere cuidado"],
      difficulty: "Difícil"
    },
    {
      name: "Square",
      description: "Práctica y resistente", 
      icon: "⬜",
      characteristics: ["Muy duradera", "Perfecta para el día a día", "Fácil de mantener"],
      difficulty: "Fácil"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "Media":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
      case "Difícil":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700";
    }
  };

  return (
    <section className="py-12 sm:py-14 lg:py-16 bg-gradient-to-br from-blue-50/50 to-violet-50/50 dark:from-blue-900/10 dark:to-violet-900/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Guía de Formas
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            ¿No estás segura? Aquí te ayudamos a elegir la forma perfecta
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {shapes.map((shape, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/30 transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className="text-center mb-3 sm:mb-4">
                <div className="text-2xl sm:text-3xl lg:text-4xl mb-2">
                  {shape.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {shape.name}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  {shape.description}
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-center">
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(shape.difficulty)}`}
                  >
                    {shape.difficulty}
                  </span>
                </div>

                <ul className="space-y-1">
                  {shape.characteristics.map((char, charIndex) => (
                    <li
                      key={charIndex}
                      className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex items-center"
                    >
                      <span className="text-blue-500 dark:text-blue-400 mr-2">
                        •
                      </span>
                      {char}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-10 lg:mt-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg dark:shadow-gray-900/20 max-w-2xl mx-auto border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
              💡 ¿Necesitas ayuda para decidir?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">
              Nuestras profesionales están aquí para aconsejarte sobre la forma
              que mejor se adapte a tu estilo de vida y gustos personales.
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-500 dark:to-violet-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-400/25 transition-all transform hover:-translate-y-0.5 text-sm sm:text-base">
              Consultar con Experta
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

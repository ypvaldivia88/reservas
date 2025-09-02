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
      case "Fácil": return "text-green-600 bg-green-100";
      case "Media": return "text-yellow-600 bg-yellow-100"; 
      case "Difícil": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-blue-25 to-violet-25">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Guía de Formas</h2>
          <p className="text-gray-700">¿No estás segura? Aquí te ayudamos a elegir la forma perfecta</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shapes.map((shape, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{shape.icon}</div>
                <h3 className="text-xl font-bold text-gray-900">{shape.name}</h3>
                <p className="text-gray-700 text-sm">{shape.description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(shape.difficulty)}`}>
                    {shape.difficulty}
                  </span>
                </div>

                <ul className="space-y-1">
                  {shape.characteristics.map((char, charIndex) => (
                    <li key={charIndex} className="text-sm text-gray-700 flex items-center">
                      <span className="text-blue-500 mr-2">•</span>
                      {char}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">💡 ¿Necesitas ayuda para decidir?</h3>
            <p className="text-gray-700 mb-4">
              Nuestras profesionales están aquí para aconsejarte sobre la forma que mejor se adapte a tu estilo de vida y gustos personales.
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-md transition-shadow">
              Consultar con Experta
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

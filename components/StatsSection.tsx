export default function StatsSection() {
  const stats = [
    { number: "500+", label: "Clientas Felices", icon: "😊" },
    { number: "3+", label: "Años de Experiencia", icon: "⭐" },
    { number: "15", label: "Servicios Disponibles", icon: "💅" },
    { number: "98%", label: "Satisfacción Garantizada", icon: "💯" }
  ];

  return (
    <section className="py-12 sm:py-14 lg:py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl mb-2">
                {stat.icon}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.number}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

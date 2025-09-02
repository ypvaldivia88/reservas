export default function StatsSection() {
  const stats = [
    { number: "500+", label: "Clientas Felices", icon: "😊" },
    { number: "3+", label: "Años de Experiencia", icon: "⭐" },
    { number: "15", label: "Servicios Disponibles", icon: "💅" },
    { number: "98%", label: "Satisfacción Garantizada", icon: "💯" }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

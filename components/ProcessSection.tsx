import Link from "next/link";

export default function ProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Reserva tu cita",
      description: "Elige tu fecha y hora preferida online o por teléfono",
      icon: "📅"
    },
    {
      number: "02", 
      title: "Consulta personalizada",
      description: "Conversamos sobre tus gustos y el diseño que deseas",
      icon: "💬"
    },
    {
      number: "03",
      title: "Servicio profesional",
      description: "Nuestras expertas trabajarán con los mejores productos",
      icon: "✨"
    },
    {
      number: "04",
      title: "Resultado perfecto",
      description: "Sal con unas uñas hermosas que durarán semanas",
      icon: "💅"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Nuestro Proceso</h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Un proceso simple y relajante diseñado para brindarte la mejor experiencia
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-400 to-violet-400 transform translate-x-4 -translate-y-1/2"></div>
              )}
              
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {step.number}
                </div>
                
                <div className="text-4xl mb-4 mt-4">{step.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-700 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-700 mb-6">¿Lista para comenzar tu transformación?</p>
          <Link href="/reserva" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 inline-block">
            Iniciar mi Proceso
          </Link>
        </div>
      </div>
    </section>
  );
}

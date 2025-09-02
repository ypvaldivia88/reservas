"use client";
import { useState, useCallback } from "react";
import { ReservaFormData, FORMAS_UNAS, LARGOS_UNAS, ApiResponse } from "@/lib/types";

interface FormErrors {
  nombre?: string;
  telefono?: string;
  forma?: string;
  largo?: string;
}

export default function ReservaForm() {
  const [form, setForm] = useState<ReservaFormData>({
    nombre: "",
    telefono: "",
    forma: "",
    largo: "",
    decoracion: "",
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((name: keyof ReservaFormData, value: string): string | undefined => {
    switch (name) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es requerido';
        if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
        break;
      case 'telefono':
        if (!value.trim()) return 'El teléfono es requerido';
        if (!/^\+?[\d\s\-()]{8,15}$/.test(value)) return 'Formato de teléfono inválido';
        break;
      case 'forma':
        if (!value) return 'Selecciona una forma';
        break;
      case 'largo':
        if (!value) return 'Selecciona un largo';
        break;
    }
  }, []);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;

      setForm((prev) => ({ ...prev, [name]: value }));

      // Validación en tiempo real
      const error = validateField(name as keyof ReservaFormData, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));

      // Limpiar mensaje anterior
      if (mensaje) setMensaje("");
    },
    [mensaje, validateField]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.entries(form).forEach(([key, value]) => {
      if (key !== "decoracion") {
        // decoracion es opcional
        const error = validateField(key as keyof ReservaFormData, value);
        if (error) {
          newErrors[key as keyof FormErrors] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [form, validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setMensaje("Por favor, corrige los errores en el formulario");
      return;
    }

    setIsSubmitting(true);
    setMensaje("");

    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
      });

      const data: ApiResponse = await res.json();

      if (data.success) {
        setMensaje("¡Reserva registrada exitosamente!");
        setForm({
          nombre: "",
          telefono: "",
          forma: "",
          largo: "",
          decoracion: "",
        });
        setErrors({});
      } else {
        setMensaje(data.message || "Error al guardar la reserva");
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formaDescriptions = {
    coffin: "Forma rectangular con punta redondeada, elegante y moderna",
    almond: "Forma ovalada puntiaguda que alarga los dedos",
    stiletto: "Forma muy puntiaguda y dramática, perfecta para nail art",
    square: "Forma cuadrada clásica, práctica y resistente",
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Header del formulario */}
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Completa tu Reserva</h2>
        <p className="opacity-90">Cuéntanos qué diseño tienes en mente</p>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-blue-100 pb-2">
              📝 Información Personal
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-gray-800 mb-2"
                >
                  Nombre Completo *
                </label>
                <div className="relative">
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    placeholder="Ej. María García"
                    value={form.nombre}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors placeholder-gray-600 text-gray-900 ${
                      errors.nombre ?
                        "border-red-300 bg-red-50"
                      : "border-gray-200 focus:border-blue-300"
                    }`}
                    required
                  />
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    👤
                  </span>
                </div>
                {errors.nombre && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.nombre}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="telefono"
                  className="block text-sm font-medium text-gray-800 mb-2"
                >
                  Teléfono de Contacto *
                </label>
                <div className="relative">
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="Ej. +1 555 123 4567"
                    value={form.telefono}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pl-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors placeholder-gray-600 text-gray-900 ${
                      errors.telefono ?
                        "border-red-300 bg-red-50"
                      : "border-gray-200 focus:border-blue-300"
                    }`}
                    required
                  />
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    📞
                  </span>
                </div>
                {errors.telefono && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.telefono}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preferencias de Diseño */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-blue-100 pb-2">
              💅 Preferencias de Diseño
            </h3>

            <div>
              <label
                htmlFor="forma"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                Forma de Uñas *
              </label>
              <select
                id="forma"
                name="forma"
                value={form.forma}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none bg-white text-gray-900 ${
                  errors.forma ?
                    "border-red-300 bg-red-50"
                  : "border-gray-200 focus:border-blue-300"
                }`}
                required
              >
                <option value="" className="text-gray-600">
                  ✨ Selecciona tu forma favorita
                </option>
                {FORMAS_UNAS.map((forma) => (
                  <option key={forma} value={forma} className="text-gray-900">
                    {forma.charAt(0).toUpperCase() + forma.slice(1)}
                  </option>
                ))}
              </select>
              {form.forma &&
                formaDescriptions[
                  form.forma as keyof typeof formaDescriptions
                ] && (
                  <p className="mt-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                    💡{" "}
                    {
                      formaDescriptions[
                        form.forma as keyof typeof formaDescriptions
                      ]
                    }
                  </p>
                )}
              {errors.forma && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.forma}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="largo"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                Largo Deseado *
              </label>
              <div className="grid grid-cols-4 gap-3">
                {LARGOS_UNAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      handleChange({
                        target: { name: "largo", value: n.toString() },
                      } as any)
                    }
                    className={`p-3 border-2 rounded-xl text-center transition-all duration-200 ${
                      form.largo === n.toString() ?
                        "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-25"
                    }`}
                  >
                    <div className="font-bold text-lg text-gray-900">{n}</div>
                    <div className="text-xs text-gray-600">
                      {n <= 3 ?
                        "Corto"
                      : n <= 5 ?
                        "Medio"
                      : "Largo"}
                    </div>
                  </button>
                ))}
              </div>
              {errors.largo && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.largo}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="decoracion"
                className="block text-sm font-medium text-gray-800 mb-2"
              >
                Decoración Especial (Opcional)
              </label>
              <div className="relative">
                <textarea
                  id="decoracion"
                  name="decoracion"
                  rows={3}
                  placeholder="Describe cualquier diseño específico que tengas en mente: colores, patrones, nail art, etc."
                  value={form.decoracion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 resize-none transition-colors placeholder-gray-600 text-gray-900"
                />
                <span className="absolute left-4 top-4 text-gray-500">🎨</span>
              </div>
              <p className="mt-2 text-xs text-gray-600">
                💡 Si no tienes una idea específica, nuestras profesionales te
                ayudarán a elegir el diseño perfecto
              </p>
            </div>
          </div>

          {/* Botón de envío */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ?
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Procesando...
                </span>
              : <span className="flex items-center justify-center">
                  ✨ Confirmar Reserva
                </span>
              }
            </button>
          </div>

          {/* Mensaje de resultado */}
          {mensaje && (
            <div
              className={`p-4 rounded-xl border-2 ${
                mensaje.includes("exitosamente") ?
                  "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {mensaje.includes("exitosamente") ? "🎉" : "⚠️"}
                </span>
                <div>
                  <p className="font-medium">{mensaje}</p>
                  {mensaje.includes("exitosamente") && (
                    <p className="text-sm opacity-80 mt-1">
                      Te contactaremos pronto para confirmar tu cita
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Nota informativa */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-violet-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Información Importante
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>
                  • Te contactaremos en las próximas 2 horas para confirmar tu
                  cita
                </li>
                <li>• Duración aproximada: 60-90 minutos según el servicio</li>
                <li>
                  • Puedes reagendar o cancelar con 24 horas de anticipación
                </li>
                <li>• Aceptamos efectivo y tarjetas de crédito/débito</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

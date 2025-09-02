"use client";
import { useState, useCallback } from "react";
import { ReservaFormData, FORMAS_UNAS, LARGOS_UNAS, ApiResponse } from "@/lib/types";

interface FormErrors {
  nombre?: string;
  telefono?: string;
  forma?: string;
  largo?: string;
  colores?: string;
}

export default function ReservaForm() {
  const [form, setForm] = useState<ReservaFormData>({
    nombre: "",
    telefono: "",
    forma: "",
    largo: "",
    colores: "",
    decoracion: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: keyof ReservaFormData, value: string): string | undefined => {
      switch (name) {
        case "nombre":
          if (!value.trim()) return "El nombre es requerido";
          if (value.trim().length < 2)
            return "El nombre debe tener al menos 2 caracteres";
          break;
        case "telefono":
          if (!value.trim()) return "El teléfono es requerido";
          if (!/^\+?[\d\s\-()]{8,15}$/.test(value))
            return "Formato de teléfono inválido";
          break;
        case "forma":
          if (!value) return "Selecciona una forma";
          break;
        case "largo":
          if (!value) return "Selecciona un largo";
          break;
      }
    },
    []
  );

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
          colores: "",
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transition-colors duration-200">
      {/* Header del formulario - Mobile First */}
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 text-white">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
          Completa tu Reserva
        </h2>
        <p className="opacity-90 text-sm sm:text-base">
          Cuéntanos qué diseño tienes en mente
        </p>
      </div>

      <div className="p-4 sm:p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Información Personal - Mobile First */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white border-b border-blue-100 dark:border-blue-800 pb-2">
              📝 Información Personal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 sm:mb-2"
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
                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 pl-9 sm:pl-12 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm sm:text-base ${
                      errors.nombre ?
                        "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600"
                      : "border-gray-200 dark:border-gray-600 focus:border-blue-300 dark:focus:border-blue-500"
                    }`}
                    required
                  />
                  <span className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    👤
                  </span>
                </div>
                {errors.nombre && (
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.nombre}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="telefono"
                  className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 sm:mb-2"
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
                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 pl-9 sm:pl-12 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm sm:text-base ${
                      errors.telefono ?
                        "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600"
                      : "border-gray-200 dark:border-gray-600 focus:border-blue-300 dark:focus:border-blue-500"
                    }`}
                    required
                  />
                  <span className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    📞
                  </span>
                </div>
                {errors.telefono && (
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.telefono}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preferencias de Diseño - Mobile First */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white border-b border-blue-100 dark:border-blue-800 pb-2">
              💅 Preferencias de Diseño
            </h3>

            <div>
              <label
                htmlFor="forma"
                className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 sm:mb-2"
              >
                Forma de Uñas *
              </label>
              <select
                id="forma"
                name="forma"
                value={form.forma}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base ${
                  errors.forma ?
                    "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600"
                  : "border-gray-200 dark:border-gray-600 focus:border-blue-300 dark:focus:border-blue-500"
                }`}
                required
              >
                <option value="" className="text-gray-600 dark:text-gray-400">
                  ✨ Selecciona tu forma favorita
                </option>
                {FORMAS_UNAS.map((forma) => (
                  <option
                    key={forma}
                    value={forma}
                    className="text-gray-900 dark:text-white"
                  >
                    {forma.charAt(0).toUpperCase() + forma.slice(1)}
                  </option>
                ))}
              </select>
              {form.forma &&
                formaDescriptions[
                  form.forma as keyof typeof formaDescriptions
                ] && (
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-lg">
                    💡{" "}
                    {
                      formaDescriptions[
                        form.forma as keyof typeof formaDescriptions
                      ]
                    }
                  </p>
                )}
              {errors.forma && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.forma}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="colores"
                className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 sm:mb-2"
              >
                Colores Preferidos
              </label>
              <input
                type="text"
                id="colores"
                name="colores"
                value={form.colores}
                onChange={handleChange}
                placeholder="🎨 Ej: Rosa pastel, dorado, nude..."
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-500 dark:placeholder:text-gray-400 ${
                  errors.colores ?
                    "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600"
                  : "border-gray-200 dark:border-gray-600 focus:border-blue-300 dark:focus:border-blue-500"
                }`}
              />
              {errors.colores && (
                <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm mt-1">
                  {errors.colores}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="largo"
                className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 sm:mb-2"
              >
                Largo Deseado *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {LARGOS_UNAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      handleChange({
                        target: { name: "largo", value: n.toString() },
                      } as any)
                    }
                    className={`p-2 sm:p-3 border-2 rounded-lg sm:rounded-xl text-center transition-all duration-200 ${
                      form.largo === n.toString() ?
                        "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                      : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-25 dark:hover:bg-blue-900/10 text-gray-900 dark:text-white"
                    }`}
                  >
                    <div className="font-bold text-base sm:text-lg">{n}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
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
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.largo}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="decoracion"
                className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 sm:mb-2"
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
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 pl-8 sm:pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-300 dark:focus:border-blue-500 resize-none transition-colors placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm sm:text-base"
                />
                <span className="absolute left-2 sm:left-4 top-2 sm:top-4 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                  🎨
                </span>
              </div>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                💡 Si no tienes una idea específica, nuestras profesionales te
                ayudarán a elegir el diseño perfecto
              </p>
            </div>
          </div>

          {/* Botón de envío - Mobile First */}
          <div className="pt-3 sm:pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-500 dark:to-violet-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl text-base sm:text-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-400/25 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isSubmitting ?
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent mr-2"></div>
                  <span className="text-sm sm:text-base">Procesando...</span>
                </span>
              : <span className="flex items-center justify-center text-sm sm:text-base">
                  ✨ Confirmar Reserva
                </span>
              }
            </button>
          </div>

          {/* Mensaje de resultado - Mobile First */}
          {mensaje && (
            <div
              className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-sm sm:text-base ${
                mensaje.includes("exitosamente") ?
                  "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700"
                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700"
              }`}
            >
              <div className="flex items-center">
                <span className="text-xl sm:text-2xl mr-2 sm:mr-3">
                  {mensaje.includes("exitosamente") ? "🎉" : "⚠️"}
                </span>
                <div>
                  <p className="font-medium">{mensaje}</p>
                  {mensaje.includes("exitosamente") && (
                    <p className="text-xs sm:text-sm opacity-80 mt-1">
                      Te contactaremos pronto para confirmar tu cita
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Nota informativa - Mobile First */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <span className="text-xl sm:text-2xl">💡</span>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-1 sm:mb-2">
                Información Importante
              </h4>
              <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1">
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

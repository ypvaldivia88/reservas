"use client";
import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import {
  ReservaFormData,
  FORMAS_UNAS,
  LARGOS_UNAS,
  ApiResponse,
  Reserva,
  User,
} from "@/lib/types";
import CalendarPicker from "./CalendarPicker";
import { openWhatsAppNotification } from "@/lib/whatsapp";

interface FormErrors {
  nombre?: string;
  telefono?: string;
  forma?: string;
  largo?: string;
  colores?: string;
  fechaCita?: string;
  horaCita?: string;
}

export default function ReservaForm() {
  // Constants
  const WHATSAPP_OPEN_DELAY_MS = 1000;

  // Predefined colors
  const PREDEFINED_COLORS = [
    { name: "Rosa", color: "#FFB6C1" },
    { name: "Rojo", color: "#DC143C" },
    { name: "Dorado", color: "#FFD700" },
    { name: "Plata", color: "#C0C0C0" },
    { name: "Negro", color: "#000000" },
    { name: "Blanco", color: "#FFFFFF" },
    { name: "Azul", color: "#4169E1" },
    { name: "Morado", color: "#9370DB" },
    { name: "Verde", color: "#32CD32" },
  ];

  // Predefined decorations
  const PREDEFINED_DECORATIONS = [
    "💅 Francés clásico",
    "✨ Glitter",
    "🌈 Degradado",
    "💎 Piedras/Cristales",
    "🌸 Flores",
    "⭐ Diseño abstracto",
    "🎨 Nail art personalizado",
    "🦋 Mariposas",
  ];

  const [form, setForm] = useState<ReservaFormData>({
    nombre: "",
    telefono: "",
    forma: "",
    largo: "",
    colores: "",
    decoracion: "",
    fechaCita: "",
    horaCita: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState("");
  const [selectedDecorations, setSelectedDecorations] = useState<string[]>([]);
  const [customDecoration, setCustomDecoration] = useState("");

  // Client lookup state
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [clientInfo, setClientInfo] = useState<{
    cliente: User;
    reservasActivas: Reserva[];
  } | null>(null);
  const [showClientInfo, setShowClientInfo] = useState(false);

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
        case "fechaCita":
          if (!value) return "Selecciona una fecha";
          break;
        case "horaCita":
          if (!value) return "Selecciona un horario";
          break;
      }
    },
    []
  );

  // Check client by phone number
  const checkClientByPhone = useCallback(
    async (telefono: string) => {
      if (!telefono.trim() || !/^\+?[\d\s\-()]{8,15}$/.test(telefono)) {
        return;
      }

      setIsCheckingPhone(true);
      setClientInfo(null);
      setShowClientInfo(false);

      try {
        const res = await fetch(
          `/api/clientes/check-phone?telefono=${encodeURIComponent(telefono.trim())}`
        );
        const data: ApiResponse<{
          exists: boolean;
          cliente?: User;
          reservasActivas?: Reserva[];
        }> = await res.json();

        if (data.success && data.data?.exists && data.data.cliente) {
          const clientData = data.data;
          if (clientData.cliente) {
            const cliente = clientData.cliente;
            setClientInfo({
              cliente,
              reservasActivas: clientData.reservasActivas || [],
            });
            setShowClientInfo(true);

            // Auto-fill name if client exists
            if (cliente.nombre && !form.nombre) {
              setForm((prev) => ({ ...prev, nombre: cliente.nombre }));
            }
          }
        }
      } catch (error) {
        console.error("Error checking client:", error);
      } finally {
        setIsCheckingPhone(false);
      }
    },
    [form.nombre]
  );

  // Update colores field when selectedColors changes
  useEffect(() => {
    const allColors = [...selectedColors];
    if (customColor.trim()) {
      allColors.push(customColor.trim());
    }
    setForm((prev) => ({ ...prev, colores: allColors.join(", ") }));
  }, [selectedColors, customColor]);

  // Update decoracion field when selectedDecorations changes
  useEffect(() => {
    const allDecorations = [...selectedDecorations];
    if (customDecoration.trim()) {
      allDecorations.push(customDecoration.trim());
    }
    setForm((prev) => ({ ...prev, decoracion: allDecorations.join(", ") }));
  }, [selectedDecorations, customDecoration]);

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

      // Check client when phone is entered
      if (name === "telefono" && value.trim().length >= 8) {
        checkClientByPhone(value);
      }
    },
    [mensaje, validateField, checkClientByPhone]
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

  // Handlers for color selection
  const toggleColor = useCallback((colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ?
        prev.filter((c) => c !== colorName)
      : [...prev, colorName]
    );
  }, []);

  // Handlers for decoration selection
  const toggleDecoration = useCallback((decoration: string) => {
    setSelectedDecorations((prev) =>
      prev.includes(decoration) ?
        prev.filter((d) => d !== decoration)
      : [...prev, decoration]
    );
  }, []);

  // button handlers
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

      const data: ApiResponse<{ insertedId: string }> = await res.json();

      if (data.success && data.data?.insertedId) {
        setMensaje(
          "¡Reserva registrada exitosamente! Abriendo WhatsApp para notificar al admin..."
        );

        const reservaId = data.data.insertedId;

        // Open WhatsApp with notification after a short delay to show success message
        setTimeout(() => {
          openWhatsAppNotification(
            {
              nombre: form.nombre,
              telefono: form.telefono,
              fechaCita: form.fechaCita,
              horaCita: form.horaCita,
              forma: form.forma,
              largo: parseInt(form.largo),
              decoracion: form.decoracion,
            },
            reservaId
          );
        }, WHATSAPP_OPEN_DELAY_MS);

        // Reset form
        setForm({
          nombre: "",
          telefono: "",
          forma: "",
          largo: "",
          colores: "",
          decoracion: "",
          fechaCita: "",
          horaCita: "",
        });
        setErrors({});
        setSelectedColors([]);
        setCustomColor("");
        setSelectedDecorations([]);
        setCustomDecoration("");
        setClientInfo(null);
        setShowClientInfo(false);
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
    coffin: "Rectangular con punta redondeada, elegante y moderna",
    almond: "Forma ovalada puntiaguda que alarga los dedos",
    stiletto: "Muy Puntiaguda y dramática, perfecta para nail art",
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
                  {isCheckingPhone && (
                    <span className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    </span>
                  )}
                </div>
                {errors.telefono && (
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.telefono}
                  </p>
                )}
              </div>
            </div>

            {/* Client info display */}
            {showClientInfo && clientInfo && (
              <div className="mt-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-200 mb-2">
                      👋 ¡Bienvenido de nuevo, {clientInfo.cliente.nombre}!
                    </p>
                    {clientInfo.reservasActivas.length > 0 ?
                      <div>
                        <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 mb-2">
                          📅 Tienes {clientInfo.reservasActivas.length} reserva
                          {clientInfo.reservasActivas.length > 1 ?
                            "s"
                          : ""}{" "}
                          activa
                          {clientInfo.reservasActivas.length > 1 ? "s" : ""}:
                        </p>
                        <div className="space-y-2">
                          {clientInfo.reservasActivas.map((reserva) => (
                            <div
                              key={reserva._id}
                              className="text-xs sm:text-sm bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {reserva.fechaCita} a las {reserva.horaCita}
                                  </span>
                                  <span
                                    className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                      reserva.estado === "confirmada" ?
                                        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                    }`}
                                  >
                                    {reserva.estado === "confirmada" ?
                                      "✓ Confirmada"
                                    : "⏳ Pendiente"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    : <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                        No tienes reservas activas en este momento.
                      </p>
                    }
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowClientInfo(false)}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Selección de Fecha y Hora */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white border-b border-blue-100 dark:border-blue-800 pb-2">
              📅 Fecha y Hora de tu Cita
            </h3>

            <CalendarPicker
              selectedDate={form.fechaCita}
              selectedTime={form.horaCita}
              onDateSelect={(date) => {
                setForm((prev) => ({ ...prev, fechaCita: date }));
                setErrors((prev) => ({ ...prev, fechaCita: undefined }));
              }}
              onTimeSelect={(time) => {
                setForm((prev) => ({ ...prev, horaCita: time }));
                setErrors((prev) => ({ ...prev, horaCita: undefined }));
              }}
            />

            {(errors.fechaCita || errors.horaCita) && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                {errors.fechaCita && (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                    <span className="mr-1">⚠️</span> {errors.fechaCita}
                  </p>
                )}
                {errors.horaCita && (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center mt-1">
                    <span className="mr-1">⚠️</span> {errors.horaCita}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Preferencias de Diseño - Mobile First */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white border-b border-blue-100 dark:border-blue-800 pb-2">
              💅 Preferencias de Diseño
            </h3>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 sm:mb-4">
                Forma de Uñas *
              </label>

              {/* Imagen de referencia */}
              <div className="relative mb-4 rounded-xl overflow-hidden h-36 sm:h-64 md:h-80 shadow-md border border-gray-200 dark:border-gray-600">
                <Image
                  src="/images/forma.jpg"
                  alt="Guía de longitudes de uñas"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {FORMAS_UNAS.map((forma) => (
                  <label
                    key={forma}
                    className={`relative flex flex-col items-center justify-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 min-h-[140px] ${
                      form.forma === forma ?
                        "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="forma"
                      value={forma}
                      checked={form.forma === forma}
                      onChange={handleChange}
                      className="sr-only"
                      required
                    />

                    {/* Icono o emoji según la forma */}
                    <div className="w-12 h-12 mb-2 flex items-center justify-center">
                      {forma === "stiletto" && (
                        <div
                          className="w-8 h-8 bg-gradient-to-t from-gray-700 to-gray-400 dark:from-gray-300 dark:to-gray-100"
                          style={{
                            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                          }}
                        />
                      )}
                      {forma === "almond" && (
                        <div
                          className="w-6 h-10 bg-gradient-to-t from-gray-700 to-gray-400 dark:from-gray-300 dark:to-gray-100 rounded-full"
                          style={{
                            clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                          }}
                        />
                      )}
                      {forma === "coffin" && (
                        <div
                          className="w-6 h-10 bg-gradient-to-t from-gray-700 to-gray-400 dark:from-gray-300 dark:to-gray-100 rounded-b-full"
                          style={{
                            clipPath:
                              "polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)",
                          }}
                        />
                      )}
                      {forma === "square" && (
                        <div className="w-6 h-10 bg-gradient-to-t from-gray-700 to-gray-400 dark:from-gray-300 dark:to-gray-100 rounded-sm" />
                      )}
                    </div>

                    <span
                      className={`text-sm font-semibold text-center mb-2 ${
                        form.forma === forma ?
                          "text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {forma.charAt(0).toUpperCase() + forma.slice(1)}
                    </span>

                    {/* Descripción de la forma */}
                    <p
                      className={`text-xs text-center px-2 ${
                        form.forma === forma ?
                          "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {
                        formaDescriptions[
                          forma as keyof typeof formaDescriptions
                        ]
                      }
                    </p>

                    {/* Checkmark cuando está seleccionado */}
                    {form.forma === forma && (
                      <span className="absolute top-2 right-2 text-blue-600 dark:text-blue-400 text-lg">
                        ✓
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {errors.forma && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.forma}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Colores Preferidos
              </label>

              {/* Color badges - predefined colors */}
              <div className="flex flex-wrap gap-2 mb-3">
                {PREDEFINED_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.name}
                    type="button"
                    onClick={() => toggleColor(colorOption.name)}
                    className={`px-3 py-1.5 rounded-full border-2 text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedColors.includes(colorOption.name) ?
                        "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500"
                      style={{ backgroundColor: colorOption.color }}
                    />
                    {colorOption.name}
                    {selectedColors.includes(colorOption.name) && (
                      <span>✓</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Native Color Picker */}
              <div className="mb-3">
                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                  🎨 O elige colores personalizados:
                </label>
                <div className="flex items-stretch gap-2 sm:gap-3">
                  <div className="relative flex-shrink-0">
                    <input
                      type="color"
                      value={customColor || "#000000"}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-10 w-12 sm:h-12 sm:w-16 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer bg-white dark:bg-gray-700 overflow-hidden"
                    />
                  </div>
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#000000"
                    maxLength={7}
                    className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-300 dark:focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        customColor.trim() &&
                        !selectedColors.includes(customColor.trim())
                      ) {
                        setSelectedColors((prev) => [
                          ...prev,
                          customColor.trim(),
                        ]);
                        setCustomColor("");
                      }
                    }}
                    disabled={!customColor.trim()}
                    className="flex-shrink-0 px-3 py-2 sm:px-4 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm whitespace-nowrap"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Display selected colors */}
              {selectedColors.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                    Colores seleccionados:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedColors.map((color) => {
                      const colorData = PREDEFINED_COLORS.find(
                        (c) => c.name === color
                      );
                      const isHexColor = color.startsWith("#");

                      return (
                        <div
                          key={color}
                          className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-gray-800 rounded-full border border-blue-200 dark:border-blue-700"
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500"
                            style={{
                              backgroundColor:
                                isHexColor ? color : colorData?.color,
                            }}
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            {color}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedColors((prev) =>
                                prev.filter((c) => c !== color)
                              )
                            }
                            className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="largo"
                className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 sm:mb-4"
              >
                Largo Deseado *
              </label>

              {/* Imagen de referencia */}
              <div className="relative mb-4 rounded-xl overflow-hidden h-80 sm:h-64 md:h-80 shadow-md border border-gray-200 dark:border-gray-600">
                <Image
                  src="/images/medidas.png"
                  alt="Guía de longitudes de uñas"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Números encima del slider */}
              <div className="flex justify-between px-1 mb-2">
                {LARGOS_UNAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      handleChange({
                        target: { name: "largo", value: n.toString() },
                      } as any)
                    }
                    className={`text-xs font-semibold transition-all ${
                      form.largo === n.toString() ?
                        "text-blue-600 dark:text-blue-400 scale-125"
                      : "text-gray-500 dark:text-gray-400 hover:text-blue-500"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={form.largo || "1"}
                onChange={(e) =>
                  handleChange({
                    target: { name: "largo", value: e.target.value },
                  } as any)
                }
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
              />

              {form.largo && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                    <span className="mr-2">✨</span>
                    Seleccionaste:{" "}
                    <strong className="ml-1">#{form.largo}</strong> -
                    <span className="ml-1">
                      {parseInt(form.largo) <= 3 ?
                        "Corto (Natural y práctico)"
                      : parseInt(form.largo) <= 5 ?
                        "Medio (Equilibrio perfecto)"
                      : "Largo (Elegante y llamativo)"}
                    </span>
                  </p>
                </div>
              )}

              {errors.largo && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.largo}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Decoración Especial (Opcional)
              </label>

              {/* Decoration options */}
              <div className="flex flex-wrap gap-2 mb-3">
                {PREDEFINED_DECORATIONS.map((decoration) => (
                  <button
                    key={decoration}
                    type="button"
                    onClick={() => toggleDecoration(decoration)}
                    className={`px-3 py-1.5 rounded-full border-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                      selectedDecorations.includes(decoration) ?
                        "border-violet-500 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-500"
                    }`}
                  >
                    {decoration}
                    {selectedDecorations.includes(decoration) && (
                      <span className="ml-1">✓</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom decoration input */}
              <div className="relative">
                <textarea
                  rows={2}
                  value={customDecoration}
                  onChange={(e) => setCustomDecoration(e.target.value)}
                  placeholder="O describe tu diseño personalizado aquí..."
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 pl-8 sm:pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-300 dark:focus:border-blue-500 resize-none transition-colors placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm sm:text-base"
                />
                <span className="absolute left-2 sm:left-4 top-2 sm:top-3 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                  🎨
                </span>
              </div>

              {/* Display selected decorations */}
              {(selectedDecorations.length > 0 || customDecoration.trim()) && (
                <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Seleccionado:{" "}
                  {[...selectedDecorations, customDecoration.trim()]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}

              <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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

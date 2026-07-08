"use client";
import Image from "next/image";
import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ReservaFormData,
  FORMAS_UNAS,
  LARGOS_UNAS,
  ApiResponse,
  Reserva,
  User,
} from "@/lib/types";
import CalendarPicker from "./CalendarPicker";
import {
  openWhatsAppNotification,
  openClientCancellationWhatsApp,
} from "@/lib/whatsapp";
import { Button } from "./ui/Button";
import { XIcon, CheckIcon } from "./ui/Icons";
import { phoneUtils } from "@/lib/utils";

// Lazy load the gallery accordion (only load when Step 6 is reached)
const InspirationGalleryAccordion = lazy(
  () => import("./InspirationGalleryAccordion")
);

interface FormErrors {
  nombre?: string;
  telefono?: string;
  forma?: string;
  largo?: string;
  colores?: string;
  fechaCita?: string;
  horaCita?: string;
}

export default function ReservaForm({
  salonSlug: salonSlugProp,
}: {
  salonSlug?: string;
}) {
  const searchParams = useSearchParams();
  const salonSlug = salonSlugProp ?? searchParams.get("slug") ?? undefined;

  const tenantQueryString = salonSlug
    ? `?slug=${encodeURIComponent(salonSlug)}`
    : "";
  const tenantParam = salonSlug
    ? `&slug=${encodeURIComponent(salonSlug)}`
    : "";

  // Constants
  const WHATSAPP_OPEN_DELAY_MS = 1000;

  // Wizard step state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7; // Aumentado de 4 a 7

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
    largo: "3",
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
  const [selectedImageUrl, setSelectedImageUrl] = useState(""); // URL de imagen de galería
  const [isNameEnabled, setIsNameEnabled] = useState(false);

  // Client lookup state
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [clientInfo, setClientInfo] = useState<{
    cliente: User;
    reservasActivas: Reserva[];
  } | null>(null);
  const [showClientInfo, setShowClientInfo] = useState(false);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reservaToCancelId, setReservaToCancelId] = useState<string | null>(
    null
  );
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedNombre = localStorage.getItem("clienteNombre");
    const savedTelefono = localStorage.getItem("clienteTelefono");

    if (savedNombre || savedTelefono) {
      setForm((prev) => ({
        ...prev,
        nombre: savedNombre || "",
        telefono: savedTelefono || "",
      }));

      // Si hay teléfono guardado, buscar información del cliente
      if (savedTelefono) {
        checkClientByPhone(savedTelefono);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar

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
          // Validar usando phoneUtils
          if (!phoneUtils.isValid(value)) {
            return "Ingresa un número cubano válido de 8 dígitos (ej: 55551234)";
          }
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

  // Modifica la función checkClientByPhone
  const checkClientByPhone = useCallback(async (telefono: string) => {
    // Validar que el teléfono tenga al menos contenido válido
    if (!telefono.trim() || telefono.trim().length < 8) {
      return;
    }

    // Validar formato antes de hacer la búsqueda
    if (!phoneUtils.isValid(telefono)) {
      return;
    }

    setIsCheckingPhone(true);
    setClientInfo(null);
    setShowClientInfo(false);

    try {
      // Enviar el teléfono tal cual (el backend lo normalizará)
      const res = await fetch(
        `/api/clientes/check-phone?telefono=${encodeURIComponent(telefono.trim())}${tenantParam}`
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
          setForm((prev) => ({ ...prev, nombre: cliente.nombre }));
          setIsNameEnabled(false); // Mantener deshabilitado si el cliente existe
        }
      } else {
        // Cliente no existe, habilitar campo nombre para registro
        setIsNameEnabled(true);
        setForm((prev) => ({ ...prev, nombre: "" }));
      }
    } catch (error) {
      console.error("Error checking client:", error);
      // En caso de error, permitir que ingrese el nombre
      setIsNameEnabled(true);
    } finally {
      setIsCheckingPhone(false);
    }
  }, [tenantParam]);

  // Update colores field when selectedColors changes
  useEffect(() => {
    setForm((prev) => ({ ...prev, colores: selectedColors.join(", ") }));
  }, [selectedColors]);

  // Update decoracion field when selectedDecorations changes
  useEffect(() => {
    const allDecorations = [...selectedDecorations];
    if (customDecoration.trim()) {
      allDecorations.push(customDecoration.trim());
    }
    setForm((prev) => ({ ...prev, decoracion: allDecorations.join(", ") }));
  }, [selectedDecorations, customDecoration]);

  // Guardar nombre y teléfono en localStorage cuando cambien
  useEffect(() => {
    if (form.nombre) {
      localStorage.setItem("clienteNombre", form.nombre);
    }
  }, [form.nombre]);

  useEffect(() => {
    if (form.telefono) {
      localStorage.setItem("clienteTelefono", form.telefono);
    }
  }, [form.telefono]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;

      // Si es teléfono, permitir solo números, +, espacios, guiones
      let processedValue = value;
      if (name === "telefono") {
        // Permitir solo caracteres válidos para teléfono
        processedValue = value.replace(/[^\d\s\-+()]/g, "");
      }

      setForm((prev) => ({ ...prev, [name]: processedValue }));

      // Validación en tiempo real
      const error = validateField(
        name as keyof ReservaFormData,
        processedValue
      );
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));

      // Limpiar mensaje anterior
      if (mensaje) setMensaje("");

      // Check client when phone is entered
      if (name === "telefono") {
        if (processedValue.trim().length >= 8) {
          checkClientByPhone(processedValue);
        } else {
          // Resetear cuando el teléfono es muy corto
          setIsNameEnabled(false);
          setClientInfo(null);
          setShowClientInfo(false);
          setForm((prev) => ({ ...prev, nombre: "" }));
        }
      }
    },
    [mensaje, validateField, checkClientByPhone]
  );

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: FormErrors = {};
      let isValid = true;

      switch (step) {
        case 1: // Información Personal
          ["nombre", "telefono"].forEach((field) => {
            const error = validateField(
              field as keyof ReservaFormData,
              form[field as keyof ReservaFormData]
            );
            if (error) {
              newErrors[field as keyof FormErrors] = error;
              isValid = false;
            }
          });
          break;
        case 2: // Fecha y Hora
          ["fechaCita", "horaCita"].forEach((field) => {
            const error = validateField(
              field as keyof ReservaFormData,
              form[field as keyof ReservaFormData]
            );
            if (error) {
              newErrors[field as keyof FormErrors] = error;
              isValid = false;
            }
          });
          if (
            form.fechaCita &&
            clientInfo?.reservasActivas.some(
              (r) => r.fechaCita === form.fechaCita
            )
          ) {
            newErrors.fechaCita =
              "Ya tienes una cita activa ese día. Cancela la existente o elige otro día.";
            isValid = false;
          }
          break;
        case 3: // Forma de Uñas
          const formaError = validateField("forma", form.forma);
          if (formaError) {
            newErrors.forma = formaError;
            isValid = false;
          }
          break;
        case 4: // Largo de Uñas
          const largoError = validateField("largo", form.largo);
          if (largoError) {
            newErrors.largo = largoError;
            isValid = false;
          }
          break;
        case 5: // Colores (opcional, siempre válido)
        case 6: // Decoración (opcional, siempre válido)
          break;
      }

      setErrors(newErrors);
      return isValid;
    },
    [form, validateField, clientInfo]
  );

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 400, behavior: "smooth" });
  }, []);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);
    setMensaje("");

    try {
      const res = await fetch(`/api/reservas${tenantQueryString}`, {
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
              imagenReferencia: selectedImageUrl || undefined, // Incluir URL de imagen si existe
            },
            reservaId
          );
        }, WHATSAPP_OPEN_DELAY_MS);

        // Reset form pero mantener nombre y teléfono
        const savedNombre = form.nombre;
        const savedTelefono = form.telefono;

        setForm({
          nombre: savedNombre, // Mantener nombre
          telefono: savedTelefono, // Mantener teléfono
          forma: "",
          largo: "1",
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
        setSelectedImageUrl(""); // Limpiar imagen seleccionada
        setCurrentStep(1); // Volver al inicio

        // Recargar información del cliente para mostrar todas sus reservas
        if (savedTelefono) {
          setTimeout(() => {
            checkClientByPhone(savedTelefono);
          }, 500); // Pequeño delay para que se procese la nueva reserva
        }
      } else {
        setMensaje(data.error || data.message || "Error al guardar la reserva");
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReservation = useCallback((reservaId: string) => {
    setReservaToCancelId(reservaId);
    setShowCancelModal(true);
    setCancellationReason("");
  }, []);

  const confirmCancellation = useCallback(async () => {
    if (!reservaToCancelId || !clientInfo) return;

    setIsCancelling(true);

    try {
      // Find the reservation to cancel
      const reserva = clientInfo.reservasActivas.find(
        (r) => r._id === reservaToCancelId
      );

      if (!reserva) {
        setMensaje("Error: Reserva no encontrada");
        return;
      }

      // Update reservation status to cancelled
      const res = await fetch(`/api/reservas/${reservaToCancelId}`, {
        method: "PATCH",
        body: JSON.stringify({ estado: "cancelada" }),
        headers: { "Content-Type": "application/json" },
      });

      const data: ApiResponse = await res.json();

      if (data.success) {
        // Open WhatsApp to notify admin
        setTimeout(() => {
          openClientCancellationWhatsApp(
            {
              nombre: reserva.nombre,
              telefono: reserva.telefono,
              fechaCita: reserva.fechaCita,
              horaCita: reserva.horaCita,
              forma: reserva.forma,
              largo: reserva.largo,
              decoracion: reserva.decoracion,
            },
            reservaToCancelId,
            cancellationReason.trim() || undefined
          );
        }, 500);

        // Update local state to remove cancelled reservation
        setClientInfo((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            reservasActivas: prev.reservasActivas.filter(
              (r) => r._id !== reservaToCancelId
            ),
          };
        });

        setMensaje(
          "Reserva cancelada exitosamente. Abriendo WhatsApp para notificar al admin..."
        );
        setShowCancelModal(false);
        setReservaToCancelId(null);
        setCancellationReason("");
      } else {
        setMensaje(data.message || "Error al cancelar la reserva");
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje("Error de conexión al cancelar la reserva");
    } finally {
      setIsCancelling(false);
    }
  }, [reservaToCancelId, clientInfo, cancellationReason]);

  const formaDescriptions = {
    coffin: "Rectangular con punta redondeada, elegante y moderna",
    almond: "Forma ovalada puntiaguda que alarga los dedos",
    stiletto: "Muy Puntiaguda y dramática, perfecta para nail art",
    square: "Forma cuadrada clásica, práctica y resistente",
  };

  const stepTitles = [
    "Información Personal",
    "Fecha y Hora",
    "Forma de Uñas",
    "Largo de Uñas",
    "Colores",
    "Decoración",
    "Confirmar Reserva",
  ];

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case 2:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case 3:
        // Forma de uñas - icono de cursor/puntero (sugiere forma/selección)
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
        );
      case 4:
        // Largo de uñas - icono de regla/medida
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case 5:
        // Colores - icono de paleta de colores
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        );
      case 6:
        // Decoración - icono de brillos/estrellas
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        );
      case 7:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transition-colors duration-200">
      {/* Progress Steps Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-600 px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 text-white">
        <div className="flex items-center justify-between mb-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                    step === currentStep ?
                      "bg-white text-blue-600 dark:text-blue-500 shadow-lg"
                    : step < currentStep ? "bg-blue-400 text-white"
                    : "bg-blue-800/30 text-white/50"
                  }`}
                >
                  {step < currentStep ?
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  : getStepIcon(step)}
                </div>
                <span
                  className={`text-xs mt-1 font-medium hidden sm:block ${
                    step === currentStep ? "text-white"
                    : step < currentStep ? "text-blue-200"
                    : "text-white/50"
                  }`}
                >
                  {stepTitles[step - 1].split(" ")[0]}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  className={`h-1 flex-1 mx-1 sm:mx-2 rounded transition-all ${
                    step < currentStep ? "bg-blue-400" : "bg-blue-800/30"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
            {stepTitles[currentStep - 1]}
          </h2>
          <p className="opacity-90 text-sm sm:text-base mt-1">
            Paso {currentStep} de {totalSteps}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8">
        <form className="space-y-4 sm:space-y-6">
          {/* Step 1: Información Personal */}
          {currentStep === 1 && (
            <div className="space-y-3 sm:space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {/* Primero el teléfono */}
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
                      placeholder="Ej: 55551234 o +53 5555 1234"
                      value={form.telefono}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 pl-9 sm:pl-12 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm sm:text-base ${
                        errors.telefono ?
                          "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-600 focus:border-blue-300 dark:focus:border-blue-500"
                      }`}
                      required
                    />
                    <span className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 text-blue-600 dark:text-blue-400">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
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
                  {!errors.telefono &&
                    !isCheckingPhone &&
                    form.telefono.length >= 8 && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Se guardará como: {phoneUtils.format(form.telefono)}
                      </p>
                    )}
                  {isCheckingPhone && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Verificando teléfono...
                    </p>
                  )}
                </div>

                {/* Luego el nombre */}
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
                      placeholder={
                        isNameEnabled ? "Ingresa tu nombre completo"
                        : clientInfo ?
                          "Cargado automáticamente"
                        : "Primero ingresa tu teléfono"
                      }
                      value={form.nombre}
                      onChange={handleChange}
                      disabled={!isNameEnabled && !clientInfo}
                      className={`w-full px-3 py-2 sm:px-4 sm:py-3 pl-9 sm:pl-12 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white text-sm sm:text-base ${
                        !isNameEnabled && !clientInfo ?
                          "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60"
                        : errors.nombre ?
                          "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600"
                        : clientInfo ?
                          "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600"
                        : "border-gray-200 dark:border-gray-600 focus:border-blue-300 dark:focus:border-blue-500 bg-white dark:bg-gray-700"
                      }`}
                      required
                    />
                    <span className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      {clientInfo ?
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      : <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      }
                    </span>
                  </div>
                  {errors.nombre && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.nombre}
                    </p>
                  )}
                  {!isNameEnabled && !clientInfo && !isCheckingPhone && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Primero verifica tu número de teléfono
                    </p>
                  )}
                  {isNameEnabled && !clientInfo && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                      ¡Nuevo cliente! Completa tu nombre para registrarte
                    </p>
                  )}
                </div>
              </div>

              {/* Client info display */}
              {showClientInfo && clientInfo && (
                <div className="mt-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                          />
                        </svg>
                        ¡Bienvenido de nuevo, {clientInfo.cliente.nombre}!
                      </p>
                      {clientInfo.reservasActivas.length > 0 ?
                        <div>
                          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                            <svg
                              className="w-4 h-4 mr-1 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Tienes {clientInfo.reservasActivas.length} reserva
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
                                className="text-xs sm:text-sm bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-700"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {reserva.fechaCita} a las{" "}
                                        {reserva.horaCita}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded text-xs ${
                                          reserva.estado === "confirmada" ?
                                            "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                        }`}
                                      >
                                        {reserva.estado === "confirmada" ?
                                          <span className="flex items-center gap-1">
                                            <svg
                                              className="w-3 h-3"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                              />
                                            </svg>
                                            Confirmada
                                          </span>
                                        : <span className="flex items-center gap-1">
                                            <svg
                                              className="w-3 h-3 animate-spin"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                              />
                                            </svg>
                                            Pendiente
                                          </span>
                                        }
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {reserva.forma} • Largo #{reserva.largo}
                                      {reserva.decoracion &&
                                        ` • ${reserva.decoracion}`}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCancelReservation(reserva._id!)
                                    }
                                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs font-medium whitespace-nowrap"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    <span>Cancelar</span>
                                  </button>
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
          )}

          {/* Step 2: Fecha y Hora */}
          {currentStep === 2 && (
            <div className="space-y-3 sm:space-y-4 animate-fadeIn">
              <CalendarPicker
                selectedDate={form.fechaCita}
                selectedTime={form.horaCita}
                telefono={form.telefono}
                salonSlug={salonSlug}
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
          )}

          {/* Step 3: Forma de Uñas */}
          {currentStep === 3 && (
            <div className="space-y-3 sm:space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 sm:mb-4">
                  Forma de Uñas *
                </label>

                {/* Imagen de referencia */}
                <div className="relative mb-4 rounded-xl overflow-hidden h-36 sm:h-64 md:h-80 shadow-md border border-gray-200 dark:border-gray-600">
                  <Image
                    src="/images/forma.jpg"
                    alt="Guía de formas de uñas"
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
            </div>
          )}

          {/* Step 4: Largo de Uñas */}
          {currentStep === 4 && (
            <div className="space-y-3 sm:space-y-4 animate-fadeIn">
              <div>
                <label
                  htmlFor="largo"
                  className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 sm:mb-4"
                >
                  Largo Deseado *
                </label>

                <div className="relative mb-4 rounded-xl overflow-hidden h-80 sm:h-64 md:h-80 shadow-md border border-gray-200 dark:border-gray-600">
                  <Image
                    src="/images/medidas.png"
                    alt="Guía de longitudes de uñas"
                    fill
                    className="object-cover"
                  />
                </div>

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
                      <svg
                        className="w-4 h-4 mr-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
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
            </div>
          )}

          {/* Step 5: Colores */}
          {currentStep === 5 && (
            <div className="space-y-3 sm:space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Colores Preferidos
                </label>

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

                <div className="mb-3">
                  <label className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <svg
                      className="w-4 h-4 mr-1 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    O elige colores personalizados:
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
            </div>
          )}

          {/* Step 6: Decoración */}
          {currentStep === 6 && (
            <div className="space-y-3 sm:space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Decoración Especial (Opcional)
                </label>

                <div className="flex flex-wrap gap-2 mb-3">
                  {PREDEFINED_DECORATIONS.map((decoration) => (
                    <button
                      key={decoration}
                      type="button"
                      onClick={() => toggleDecoration(decoration)}
                      className={`px-3 py-1.5 rounded-full border-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                        selectedDecorations.includes(decoration) ?
                          "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500"
                      }`}
                    >
                      {decoration}
                      {selectedDecorations.includes(decoration) && (
                        <span className="ml-1">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    value={customDecoration}
                    onChange={(e) => setCustomDecoration(e.target.value)}
                    placeholder="O describe tu diseño personalizado aquí..."
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 pl-8 sm:pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-300 dark:focus:border-blue-500 resize-none transition-colors placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm sm:text-base"
                  />
                  <span className="absolute left-2 sm:left-4 top-2 sm:top-3 text-blue-600 dark:text-blue-400">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                  </span>
                </div>

                {(selectedDecorations.length > 0 ||
                  customDecoration.trim()) && (
                  <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Seleccionado:{" "}
                    {[...selectedDecorations, customDecoration.trim()]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}

                <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <svg
                    className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Si no tienes una idea específica, nuestras profesionales te
                  ayudarán a elegir el diseño perfecto
                </p>
              </div>

              {/* Galería de Inspiración - Solo en Step 6 */}
              <div className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                      <span className="ml-3 text-gray-600 dark:text-gray-400">
                        Cargando galería...
                      </span>
                    </div>
                  }
                >
                  <InspirationGalleryAccordion
                    salonSlug={salonSlug}
                    onImageSelect={(image) => {
                      const designText =
                        image.descripcion ?
                          `${image.titulo || image.nombre} - ${image.descripcion}`
                        : image.titulo || image.nombre;
                      setCustomDecoration(designText);
                      setSelectedImageUrl(image.blobUrl); // Guardar URL de la imagen
                    }}
                  />
                </Suspense>
              </div>
            </div>
          )}

          {/* Step 7: Confirmar Reserva */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  Resumen de tu Reserva
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Nombre:
                    </span>
                    <span className="font-medium">{form.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Teléfono:
                    </span>
                    <span className="font-medium">{form.telefono}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Fecha:
                    </span>
                    <span className="font-medium">{form.fechaCita}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Hora:
                    </span>
                    <span className="font-medium">{form.horaCita}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Forma:
                    </span>
                    <span className="font-medium capitalize">{form.forma}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Largo:
                    </span>
                    <span className="font-medium">#{form.largo}</span>
                  </div>
                  {form.colores && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Colores:
                      </span>
                      <span className="font-medium text-right">
                        {form.colores}
                      </span>
                    </div>
                  )}
                  {form.decoracion && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Decoración:
                      </span>
                      <span className="font-medium text-right">
                        {form.decoracion}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-1 sm:mb-2">
                      Información Importante
                    </h4>
                    <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>
                        • Te contactaremos en las próximas horas para confirmar
                        tu cita
                      </li>
                      <li>
                        • Duración aproximada: 60-90 minutos según el servicio
                      </li>
                      <li>
                        • Solo puedes tener una cita activa por día
                      </li>
                      <li>
                        • Puedes reagendar o cancelar con 24 horas de
                        anticipación
                      </li>
                      <li>• Aceptamos efectivo y tarjetas de crédito/débito</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-3 sm:pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handlePrevious}
                variant="outlined-secondary"
                fullWidth
                size="lg"
              >
                ← Anterior
              </Button>
            )}
            {currentStep < totalSteps ?
              <Button
                type="button"
                onClick={handleNext}
                variant="primary"
                fullWidth
                size="lg"
              >
                Siguiente →
              </Button>
            : <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                variant="primary"
                loading={isSubmitting}
                fullWidth
                size="lg"
                icon={
                  !isSubmitting && (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  )
                }
              >
                Confirmar Reserva
              </Button>
            }
          </div>

          {/* Mensaje de resultado */}
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
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-start mb-4">
              <span className="text-4xl mr-3">⚠️</span>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Cancelar Reserva
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ¿Estás seguro que deseas cancelar esta reserva? Esta acción
                  notificará al administrador.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="cancellationReason"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Motivo de cancelación (opcional)
              </label>
              <textarea
                id="cancellationReason"
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Ej: Surgió un compromiso, necesito reagendar, etc."
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-300 dark:focus:border-red-500 resize-none transition-colors placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
                disabled={isCancelling}
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-start">
                <svg
                  className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  <strong>Nota:</strong> Al confirmar, se abrirá WhatsApp para
                  notificar al administrador sobre tu solicitud de cancelación.
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setReservaToCancelId(null);
                  setCancellationReason("");
                }}
                disabled={isCancelling}
                variant="outlined-secondary"
                fullWidth
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={confirmCancellation}
                disabled={isCancelling}
                variant="danger"
                loading={isCancelling}
                fullWidth
              >
                Sí, Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

"use client";
import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ReservaFormData,
  ApiResponse,
  Reserva,
  User,
  BusinessTemplate,
} from "@/lib/types";
import CalendarPicker from "./CalendarPicker";
import {
  openWhatsAppNotification,
  openClientCancellationWhatsApp,
} from "@/lib/whatsapp";
import { Button } from "./ui/Button";
import { XIcon, CheckIcon } from "./ui/Icons";
import { phoneUtils } from "@/lib/utils";
import { FORMA_LABELS } from "@/lib/nail-form-labels";
import { isValidHexColor, normalizeHexColor } from "@/lib/color-utils";
import ReservaServiceDetailsStep from "@/components/reserva/ReservaServiceDetailsStep";
import {
  applyTemplateFormDefaults,
  buildReservaCreatePayloadFromForm,
} from "@/lib/reserva-payload";
import ReservaGenericDetailsStep from "@/components/reserva/ReservaGenericDetailsStep";
import ReservaOptionalPreferences from "@/components/reserva/ReservaOptionalPreferences";
import {
  getReservaTemplateConfig,
  isManicureReservation,
  formatActiveReservationDetail,
} from "@/lib/reserva-template-config";
import { IconInput } from "@/components/design/IconInput";

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
  salonWhatsapp: salonWhatsappProp,
}: {
  salonSlug?: string;
  salonWhatsapp?: string;
}) {
  const searchParams = useSearchParams();
  const salonSlug = salonSlugProp ?? searchParams.get("slug") ?? undefined;

  const tenantQueryString = salonSlug
    ? `?slug=${encodeURIComponent(salonSlug)}`
    : "";
  const tenantParam = salonSlug
    ? `&slug=${encodeURIComponent(salonSlug)}`
    : "";

  const [salonWhatsapp, setSalonWhatsapp] = useState<string | undefined>(
    salonWhatsappProp
  );
  const [businessTemplate, setBusinessTemplate] = useState<
    BusinessTemplate | undefined
  >(undefined);

  const isManicure = isManicureReservation(businessTemplate);
  const templateConfig = isManicure
    ? getReservaTemplateConfig("manicure")
    : getReservaTemplateConfig(businessTemplate);
  const wizard = templateConfig.reservation.wizard;

  useEffect(() => {
    if (salonWhatsappProp) {
      setSalonWhatsapp(salonWhatsappProp);
      return;
    }
    if (!salonSlug) return;

    let cancelled = false;
    fetch(`/api/salons/public?slug=${encodeURIComponent(salonSlug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        const profile = data.data;
        setBusinessTemplate(profile.businessTemplate);
        const number =
          profile.social?.whatsapp ||
          profile.whatsappNumber ||
          profile.contact?.phone;
        if (number) setSalonWhatsapp(number);
      })
      .catch(() => {
        // Sin perfil público: se mantiene el wizard de manicure (comportamiento legacy)
      });

    return () => {
      cancelled = true;
    };
  }, [salonSlug, salonWhatsappProp]);

  // Constants
  const WHATSAPP_OPEN_DELAY_MS = 1000;

  // Wizard step state
  const [currentStep, setCurrentStep] = useState(1);
  const [showOptionalPreferences, setShowOptionalPreferences] = useState(false);
  const totalSteps = 4;

  const [form, setForm] = useState<ReservaFormData>({
    nombre: "",
    telefono: "",
    forma: "square",
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
          if (!isManicure) return undefined;
          if (!value) return "Selecciona una forma";
          break;
        case "largo":
          if (!isManicure) return undefined;
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
    [businessTemplate, isManicure]
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
        case 3: // Forma y largo (manicure) — optional; defaults on submit
          break;
        case 4: // Confirmar
          break;
      }

      setErrors(newErrors);
      return isValid;
    },
    [form, validateField, clientInfo, isManicure]
  );

  const handleNext = useCallback(() => {
    const steppedForm =
      currentStep === 3
        ? applyTemplateFormDefaults(form, businessTemplate)
        : form;

    if (currentStep === 3) {
      setForm(steppedForm);
    }

    if (!validateStep(currentStep)) return;

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    window.scrollTo({ top: 400, behavior: "smooth" });
  }, [currentStep, validateStep, businessTemplate, form]);

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
      const payload = buildReservaCreatePayloadFromForm(form, businessTemplate);

      for (let step = 1; step <= 3; step++) {
        if (!validateStep(step)) {
          setCurrentStep(step);
          setIsSubmitting(false);
          return;
        }
      }

      const res = await fetch(`/api/reservas${tenantQueryString}`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      const data: ApiResponse<{ insertedId: string; whatsappNumber?: string }> =
        await res.json();

      if (data.success && data.data?.insertedId) {
        const reservaId = data.data.insertedId;
        const notifyWhatsapp = data.data.whatsappNumber || salonWhatsapp;

        setMensaje(
          notifyWhatsapp
            ? "¡Reserva registrada exitosamente! Abriendo WhatsApp para notificar al admin..."
            : "¡Reserva registrada exitosamente! El salón aún no tiene WhatsApp configurado para notificaciones."
        );

        if (notifyWhatsapp) {
          setTimeout(() => {
            openWhatsAppNotification(
              {
                nombre: payload.nombre,
                telefono: payload.telefono,
                fechaCita: payload.fechaCita,
                horaCita: payload.horaCita,
                forma: payload.forma,
                largo: payload.largo,
                decoracion: payload.decoracion,
                imagenReferencia: selectedImageUrl || undefined,
              },
              reservaId,
              notifyWhatsapp,
              businessTemplate
            );
          }, WHATSAPP_OPEN_DELAY_MS);
        }

        // Reset form pero mantener nombre y teléfono
        const savedNombre = form.nombre;
        const savedTelefono = form.telefono;

        setForm({
          nombre: savedNombre,
          telefono: savedTelefono,
          forma: "square",
          largo: "3",
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

      // Cancelar vía API pública con scope de tenant
      const res = await fetch(
        `/api/reservas/${reservaToCancelId}/cancel${tenantQueryString}`,
        {
          method: "POST",
          body: JSON.stringify({
            telefono: clientInfo.cliente.telefono || reserva.telefono,
            motivo: cancellationReason.trim() || undefined,
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const data: ApiResponse<{ whatsappNumber?: string }> = await res.json();

      if (data.success) {
        const notifyWhatsapp = data.data?.whatsappNumber || salonWhatsapp;

        setMensaje(
          notifyWhatsapp
            ? "Reserva cancelada exitosamente. Abriendo WhatsApp para notificar al admin..."
            : "Reserva cancelada exitosamente."
        );

        if (notifyWhatsapp) {
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
              cancellationReason.trim() || undefined,
              notifyWhatsapp
            );
          }, 500);
        }

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

        setShowCancelModal(false);
        setReservaToCancelId(null);
        setCancellationReason("");
      } else {
        setMensaje(data.error || data.message || "Error al cancelar la reserva");
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje("Error de conexión al cancelar la reserva");
    } finally {
      setIsCancelling(false);
    }
  }, [
    reservaToCancelId,
    clientInfo,
    cancellationReason,
    salonWhatsapp,
    tenantQueryString,
  ]);

  const stepTitles = [
    wizard.step1.title,
    wizard.step2.title,
    wizard.step3.title,
    wizard.step4.title,
  ];

  const stepHints = [
    wizard.step1.hint,
    wizard.step2.hint,
    wizard.step3.hint,
    wizard.step4.hint,
  ];

  const applyRecommendedService = () => {
    setForm((prev) => ({ ...prev, forma: "square", largo: "3" }));
    setErrors((prev) => ({ ...prev, forma: undefined, largo: undefined }));
  };

  const handleAddCustomColor = () => {
    const trimmed = customColor.trim();
    if (!isValidHexColor(trimmed)) return;
    const normalized = normalizeHexColor(trimmed);
    if (!selectedColors.includes(normalized)) {
      setSelectedColors((prev) => [...prev, normalized]);
      setCustomColor("");
    }
  };

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
    <div className="overflow-hidden rounded-2xl bg-card shadow-xl transition-colors duration-200 sm:rounded-3xl">
      {/* Progress Steps Header */}
      <div className="bg-primary px-4 py-4 text-primary-foreground sm:px-6 sm:py-5 md:px-8 md:py-6">
        <div className="flex items-center justify-between mb-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                    step === currentStep ?
                      "bg-card text-primary shadow-lg"
                    : step < currentStep ? "bg-primary/70 text-primary-foreground"
                    : "bg-primary-foreground/20 text-primary-foreground/50"
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
                    step === currentStep ? "text-primary-foreground"
                    : step < currentStep ? "text-primary-foreground/80"
                    : "text-primary-foreground/50"
                  }`}
                >
                  {isManicure
                    ? stepTitles[step - 1].split(" ")[0]
                    : [
                        wizard.step1,
                        wizard.step2,
                        wizard.step3,
                        wizard.step4,
                      ][step - 1].shortLabel}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  className={`h-1 flex-1 mx-1 sm:mx-2 rounded transition-all ${
                    step < currentStep ? "bg-primary/70" : "bg-primary-foreground/20"
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
            Paso {currentStep} de {totalSteps} · {stepHints[currentStep - 1]}
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
                    className="mb-2 block text-base font-semibold"
                  >
                    Tu teléfono *
                  </label>
                  <div className="relative">
                    <IconInput
                      id="telefono"
                      name="telefono"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="Ej: 5555 1234"
                      value={form.telefono}
                      onChange={handleChange}
                      className={`min-h-12 rounded-xl border-2 bg-card text-base ${
                        errors.telefono ?
                          "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-600 focus:border-primary"
                      }`}
                      required
                      icon={
                        <svg
                          className="size-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      }
                      trailing={
                        isCheckingPhone ? (
                          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : undefined
                      }
                    />
                  </div>
                  {errors.telefono && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.telefono}
                    </p>
                  )}
                  {!errors.telefono &&
                    !isCheckingPhone &&
                    form.telefono.length >= 8 && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-primary flex items-center">
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
                    className="mb-2 block text-base font-semibold"
                  >
                    Tu nombre *
                  </label>
                  <div className="relative">
                    <IconInput
                      id="nombre"
                      name="nombre"
                      type="text"
                      autoComplete="name"
                      placeholder={
                        isNameEnabled
                          ? isManicure
                            ? "Ej: María García"
                            : wizard.step1.nombrePlaceholder
                          : clientInfo
                            ? "Cargado automáticamente"
                            : "Primero ingresa tu teléfono"
                      }
                      value={form.nombre}
                      onChange={handleChange}
                      disabled={!isNameEnabled && !clientInfo}
                      className={`min-h-12 rounded-xl border-2 text-base ${
                        !isNameEnabled && !clientInfo ?
                          "cursor-not-allowed bg-gray-100 opacity-60 dark:bg-gray-800"
                        : errors.nombre ?
                          "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600"
                        : clientInfo ?
                          "border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20"
                        : "border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700"
                      }`}
                      required
                      icon={
                        clientInfo ?
                          <svg
                            className="size-5 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        : <svg
                            className="size-5 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                      }
                    />
                  </div>
                  {errors.nombre && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center">
                      <span className="mr-1">⚠️</span> {errors.nombre}
                    </p>
                  )}
                  {!isNameEnabled && !clientInfo && !isCheckingPhone && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-primary flex items-center">
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
                <div className="mt-3 p-3 sm:p-4 bg-primary/10 border-2 border-primary/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-medium text-foreground mb-2 flex items-center">
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
                          <p className="text-xs sm:text-sm text-foreground mb-2 flex items-center">
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
                                className="text-xs sm:text-sm bg-white dark:bg-gray-800 p-3 rounded border border-primary/30"
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
                                      {formatActiveReservationDetail(
                                        reserva,
                                        businessTemplate
                                      )}
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
                      : <p className="text-xs sm:text-sm text-foreground">
                          No tienes reservas activas en este momento.
                        </p>
                      }
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowClientInfo(false)}
                      className="ml-2 text-primary hover:text-foreground"
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

          {/* Step 3: Detalles del servicio */}
          {currentStep === 3 && isManicure && (
            <ReservaServiceDetailsStep
              form={form}
              errors={errors}
              onFieldChange={handleChange}
              onApplyRecommended={applyRecommendedService}
            />
          )}
          {currentStep === 3 && !isManicure && (
            <ReservaGenericDetailsStep
              config={templateConfig}
              notes={form.decoracion}
              onNotesChange={(value) =>
                setForm((prev) => ({ ...prev, decoracion: value }))
              }
              onQuickOption={(option) =>
                setForm((prev) => ({ ...prev, decoracion: option }))
              }
            />
          )}

          {/* Step 4: Confirmar */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 sm:p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  {isManicure
                    ? "Resumen de tu cita"
                    : wizard.step4.summaryTitle}
                </h3>
                <dl className="space-y-3 text-base">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Nombre</dt>
                    <dd className="font-medium text-right">{form.nombre}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Teléfono</dt>
                    <dd className="font-medium text-right">{form.telefono}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Fecha</dt>
                    <dd className="font-medium text-right">{form.fechaCita}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Hora</dt>
                    <dd className="font-medium text-right">{form.horaCita}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {templateConfig.reservation.summaryDetailsLabel}
                    </dt>
                    <dd className="font-medium text-right">
                      {isManicure ?
                        FORMA_LABELS[form.forma as keyof typeof FORMA_LABELS]
                          ?.label ?? form.forma
                      : form.decoracion || "A confirmar con el negocio"}
                    </dd>
                  </div>
                  {isManicure && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Largo</dt>
                      <dd className="font-medium text-right">
                        Nivel {form.largo}
                      </dd>
                    </div>
                  )}
                  {!isManicure && form.colores && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Colores</dt>
                      <dd className="font-medium text-right">{form.colores}</dd>
                    </div>
                  )}
                  {form.decoracion && isManicure && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Decoración</dt>
                      <dd className="font-medium text-right">{form.decoracion}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <ReservaOptionalPreferences
                open={showOptionalPreferences}
                onToggle={() => setShowOptionalPreferences((prev) => !prev)}
                salonSlug={salonSlug}
                preferences={templateConfig.reservation.optionalPreferences}
                selectedColors={selectedColors}
                customColor={customColor}
                selectedDecorations={selectedDecorations}
                customDecoration={customDecoration}
                onToggleColor={toggleColor}
                onCustomColorChange={setCustomColor}
                onAddCustomColor={handleAddCustomColor}
                onRemoveColor={(color) =>
                  setSelectedColors((prev) => prev.filter((c) => c !== color))
                }
                onToggleDecoration={toggleDecoration}
                onCustomDecorationChange={setCustomDecoration}
                onImageSelect={(image) => {
                  const designText =
                    image.descripcion ?
                      `${image.titulo || image.nombre} - ${image.descripcion}`
                    : image.titulo || image.nombre || "";
                  setCustomDecoration(designText);
                  setSelectedImageUrl(image.blobUrl);
                }}
              />

              <div className="rounded-xl border border-primary/20 bg-muted/30 p-4 sm:p-5">
                <h4 className="mb-2 text-base font-semibold text-foreground">
                  {isManicure ? "Qué pasa después" : wizard.step4.afterTitle}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground sm:text-base">
                  {(isManicure
                    ? [
                        "Te contactaremos para confirmar tu cita",
                        "Duración aproximada: 60–90 minutos",
                        "Puedes reagendar o cancelar con 24 h de anticipación",
                      ]
                    : wizard.step4.afterBullets
                  ).map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
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
                {currentStep === 3
                  ? isManicure
                    ? "Ver resumen →"
                    : wizard.step4.nextFromStep3
                  : "Siguiente →"}
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )
                }
              >
                {isManicure ? "Confirmar cita" : wizard.step4.submitLabel}
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
          <div className="animate-fadeIn rounded-2xl bg-card shadow-2xl max-w-md w-full p-6">
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

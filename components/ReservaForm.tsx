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

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Validación en tiempo real
    const error = validateField(name as keyof ReservaFormData, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    // Limpiar mensaje anterior
    if (mensaje) setMensaje("");
  }, [mensaje, validateField]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.entries(form).forEach(([key, value]) => {
      if (key !== 'decoracion') { // decoracion es opcional
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
      console.error('Error:', error);
      setMensaje("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            placeholder="Ingresa tu nombre"
            value={form.nombre}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.nombre ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            placeholder="Ingresa tu teléfono"
            value={form.telefono}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.telefono ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
        </div>

        <div>
          <label htmlFor="forma" className="block text-sm font-medium text-gray-700 mb-1">
            Forma *
          </label>
          <select 
            id="forma"
            name="forma" 
            value={form.forma} 
            onChange={handleChange} 
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.forma ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Selecciona forma</option>
            {FORMAS_UNAS.map((forma) => (
              <option key={forma} value={forma}>
                {forma.charAt(0).toUpperCase() + forma.slice(1)}
              </option>
            ))}
          </select>
          {errors.forma && <p className="mt-1 text-sm text-red-600">{errors.forma}</p>}
        </div>

        <div>
          <label htmlFor="largo" className="block text-sm font-medium text-gray-700 mb-1">
            Largo *
          </label>
          <select 
            id="largo"
            name="largo" 
            value={form.largo} 
            onChange={handleChange} 
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.largo ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Selecciona largo</option>
            {LARGOS_UNAS.map((n) => (
              <option key={n} value={n}>
                Largo {n}
              </option>
            ))}
          </select>
          {errors.largo && <p className="mt-1 text-sm text-red-600">{errors.largo}</p>}
        </div>

        <div>
          <label htmlFor="decoracion" className="block text-sm font-medium text-gray-700 mb-1">
            Decoración (opcional)
          </label>
          <input
            id="decoracion"
            name="decoracion"
            type="text"
            placeholder="Describe la decoración deseada"
            value={form.decoracion}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Guardando...' : 'Reservar'}
        </button>
        
        {mensaje && (
          <div className={`p-3 rounded-md text-sm ${
            mensaje.includes('exitosamente') 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {mensaje}
          </div>
        )}
      </form>
    </div>
  );
}

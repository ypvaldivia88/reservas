import { useState, useCallback } from 'react';
import { Reserva, ReservaFormData, ApiResponse } from '@/lib/types';

interface UseReservasReturn {
  reservas: Reserva[];
  loading: boolean;
  error: string | null;
  crear: (data: ReservaFormData) => Promise<boolean>;
  obtener: () => Promise<void>;
}

export const useReservas = (): UseReservasReturn => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtener = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reservas');
      const data: ApiResponse<Reserva[]> = await response.json();

      if (data.success && data.data) {
        setReservas(data.data);
      } else {
        setError(data.error || 'Error al obtener reservas');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching reservas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const crear = useCallback(async (formData: ReservaFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        // Refrescar la lista de reservas
        await obtener();
        return true;
      } else {
        setError(data.error || 'Error al crear reserva');
        return false;
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error creating reserva:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [obtener]);

  return {
    reservas,
    loading,
    error,
    crear,
    obtener,
  };
};

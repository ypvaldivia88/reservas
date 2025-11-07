import { NextResponse } from 'next/server';
import { normalizePhones } from '@/scripts/normalize-phones';
import type { ApiResponse } from '@/lib/types';

/**
 * Endpoint temporal para normalizar todos los teléfonos en la base de datos
 * Solo debe ejecutarse una vez
 * 
 * IMPORTANTE: Este endpoint debe ser protegido o eliminado después de usarlo
 */
export async function POST() {
  try {
    console.log('🚀 Iniciando normalización de teléfonos...');
    
    const result = await normalizePhones();
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Teléfonos normalizados exitosamente'
    } as ApiResponse);

  } catch (error) {
    console.error('❌ Error normalizando teléfonos:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error normalizando teléfonos',
        message: error instanceof Error ? error.message : 'Error desconocido'
      } as ApiResponse,
      { status: 500 }
    );
  }
}

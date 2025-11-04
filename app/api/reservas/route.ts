import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Reserva, ApiResponse, FORMAS_UNAS, User } from "@/lib/types";
import { dateUtils } from "@/lib/utils";
import { sendAdminNotification } from "@/lib/whatsapp";

// Función de validación
function validarReserva(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim().length < 2) {
    errors.push('El nombre es requerido y debe tener al menos 2 caracteres');
  }

  if (!data.telefono || typeof data.telefono !== 'string' || !/^\+?[\d\s\-()]{8,15}$/.test(data.telefono)) {
    errors.push('El teléfono debe tener un formato válido');
  }

  if (!data.forma || !FORMAS_UNAS.includes(data.forma)) {
    errors.push('La forma debe ser una opción válida');
  }

  const largo = Number(data.largo);
  if (!largo || largo < 1 || largo > 8) {
    errors.push('El largo debe ser un número entre 1 y 8');
  }

  // Validar fecha de cita
  if (!data.fechaCita || typeof data.fechaCita !== 'string') {
    errors.push('La fecha de cita es requerida');
  } else if (!dateUtils.isFutureDate(data.fechaCita)) {
    errors.push('La fecha de cita no puede ser en el pasado');
  }

  // Validar hora de cita
  if (!data.horaCita || typeof data.horaCita !== 'string' || !dateUtils.isValidTimeFormat(data.horaCita)) {
    errors.push('La hora de cita es requerida y debe tener formato HH:mm');
  }

  return { isValid: errors.length === 0, errors };
}

// GET: Obtiene todas las reservas
export async function GET(): Promise<NextResponse<ApiResponse<Reserva[]>>> {
  try {
    console.log('🔍 Iniciando GET /api/reservas');
    console.log('📁 MONGODB_URI configurado:', !!process.env.MONGODB_URI);
    
    const client = await clientPromise;
    console.log('✅ Cliente MongoDB conectado');
    
    const db = client.db("nailsalon");
    console.log('📊 Base de datos seleccionada: nailsalon');
    
    const reservas = await db
      .collection<Reserva>("reservas")
      .find({})
      .sort({ fechaCreacion: -1 })
      .toArray();
    
    console.log(`📋 ${reservas.length} reservas encontradas`);

    return NextResponse.json({
      success: true,
      data: reservas,
      message: 'Reservas obtenidas exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en GET /api/reservas:', error);
    console.error('📍 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Crea una nueva reserva
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ insertedId: string }>>> {
  try {
    const data = await request.json();

    // Validar datos de entrada
    const validacion = validarReserva(data);
    if (!validacion.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de entrada inválidos',
          message: validacion.errors.join(', ')
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nailsalon");
    
    // Validar que la fecha/hora esté disponible
    const existingReserva = await db.collection<Reserva>("reservas").findOne({
      fechaCita: data.fechaCita,
      horaCita: data.horaCita,
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    if (existingReserva) {
      return NextResponse.json(
        {
          success: false,
          error: 'Horario no disponible',
          message: 'Este horario ya está reservado. Por favor selecciona otro horario.'
        },
        { status: 400 }
      );
    }
    
    // Normalizar teléfono para búsqueda consistente
    const telefonoNormalizado = data.telefono.trim();
    const nombreNormalizado = data.nombre.trim();

    // Buscar cliente existente por teléfono
    let cliente = await db.collection<User>("users").findOne({ 
      telefono: telefonoNormalizado,
      role: 'cliente'
    });

    if (cliente) {
      // Si el teléfono existe pero el nombre es diferente, verificar para evitar duplicados
      if (cliente.nombre !== nombreNormalizado) {
        return NextResponse.json(
          {
            success: false,
            error: 'Teléfono ya registrado con otro nombre',
            message: `Este teléfono está registrado con el nombre: ${cliente.nombre}. Por favor verifica tus datos.`
          },
          { status: 400 }
        );
      }
    } else {
      // Registrar nuevo cliente si el teléfono no existe
      const nuevoCliente: Omit<User, '_id'> = {
        nombre: nombreNormalizado,
        telefono: telefonoNormalizado,
        role: 'cliente',
        fechaCreacion: new Date()
      };
      
      const resultCliente = await db.collection<User>("users").insertOne(nuevoCliente);
      cliente = { ...nuevoCliente, _id: resultCliente.insertedId.toString() };
      console.log('✨ Nuevo cliente registrado:', nombreNormalizado);
      
      // Enviar notificación de nuevo cliente
      sendAdminNotification({
        type: 'new_client',
        data: {
          nombre: nombreNormalizado,
          telefono: telefonoNormalizado
        }
      }).catch(err => console.error('Error enviando notificación de nuevo cliente:', err));
    }

    // Preparar datos para inserción de reserva
    const nuevaReserva: Omit<Reserva, '_id'> = {
      clienteId: cliente?._id?.toString(),
      nombre: nombreNormalizado,
      telefono: telefonoNormalizado,
      forma: data.forma,
      largo: Number(data.largo),
      decoracion: data.decoracion?.trim() || '',
      fechaCreacion: new Date(),
      fechaCita: data.fechaCita,
      horaCita: data.horaCita,
      estado: 'pendiente'
    };
    
    const result = await db.collection<Reserva>("reservas").insertOne(nuevaReserva);

    // Enviar notificación de nueva reserva
    sendAdminNotification({
      type: 'new_reservation',
      data: {
        nombre: nombreNormalizado,
        telefono: telefonoNormalizado,
        fechaCita: data.fechaCita,
        horaCita: data.horaCita,
        forma: data.forma,
        largo: Number(data.largo)
      }
    }).catch(err => console.error('Error enviando notificación de reserva:', err));

    return NextResponse.json({
      success: true,
      data: { insertedId: result.insertedId.toString() },
      message: 'Reserva creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando reserva:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato JSON inválido'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

/**
 * Script para normalizar teléfonos en la base de datos
 * Este script actualiza todos los teléfonos existentes al formato normalizado (+53XXXXXXXX)
 * 
 * Uso: Ejecutar desde Next.js como API route temporal
 */

import { MongoClient } from 'mongodb';

// Función de normalización (copiada de lib/utils.ts)
function normalizePhone(phone: string): string {
  // Eliminar todos los espacios, guiones, paréntesis y otros caracteres
  let normalized = phone.replace(/[\s\-()]/g, '');
  
  // Si comienza con +53, mantenerlo
  if (normalized.startsWith('+53')) {
    return normalized;
  }
  
  // Si comienza con 53 sin +, agregar el +
  if (normalized.startsWith('53')) {
    return '+' + normalized;
  }
  
  // Si no tiene código de país, agregar +53 (Cuba)
  if (normalized.length === 8) {
    return '+53' + normalized;
  }
  
  // Si ya tiene + pero no es +53, devolver tal cual
  if (normalized.startsWith('+')) {
    return normalized;
  }
  
  // Por defecto, agregar +53
  return '+53' + normalized;
}

async function normalizePhones() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI no está definido en las variables de entorno');
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db('nailsalon');
    const usersCollection = db.collection('users');
    const reservasCollection = db.collection('reservas');

    // Normalizar teléfonos en users
    console.log('\n📱 Normalizando teléfonos en colección "users"...');
    const users = await usersCollection.find({}).toArray();
    let usersUpdated = 0;

    for (const user of users) {
      if (user.telefono) {
        const normalizedPhone = normalizePhone(user.telefono);
        if (normalizedPhone !== user.telefono) {
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { telefono: normalizedPhone } }
          );
          console.log(`  ✓ Usuario ${user.nombre}: ${user.telefono} → ${normalizedPhone}`);
          usersUpdated++;
        }
      }
    }

    console.log(`✅ ${usersUpdated} usuarios actualizados de ${users.length} totales`);

    // Normalizar teléfonos en reservas
    console.log('\n📅 Normalizando teléfonos en colección "reservas"...');
    const reservas = await reservasCollection.find({}).toArray();
    let reservasUpdated = 0;

    for (const reserva of reservas) {
      if (reserva.telefono) {
        const normalizedPhone = normalizePhone(reserva.telefono);
        if (normalizedPhone !== reserva.telefono) {
          await reservasCollection.updateOne(
            { _id: reserva._id },
            { $set: { telefono: normalizedPhone } }
          );
          console.log(`  ✓ Reserva ${reserva.nombre}: ${reserva.telefono} → ${normalizedPhone}`);
          reservasUpdated++;
        }
      }
    }

    console.log(`✅ ${reservasUpdated} reservas actualizadas de ${reservas.length} totales`);

    // Buscar posibles duplicados
    console.log('\n🔍 Buscando posibles duplicados...');
    const phoneGroups = await usersCollection.aggregate([
      { 
        $group: { 
          _id: '$telefono', 
          count: { $sum: 1 },
          nombres: { $push: '$nombre' },
          ids: { $push: '$_id' }
        } 
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (phoneGroups.length > 0) {
      console.log(`⚠️  Se encontraron ${phoneGroups.length} teléfonos duplicados:`);
      phoneGroups.forEach(group => {
        console.log(`  📞 ${group._id}:`);
        group.nombres.forEach((nombre: string, i: number) => {
          console.log(`     - ${nombre} (ID: ${group.ids[i]})`);
        });
      });
      console.log('\n💡 Revisa estos duplicados manualmente y decide cuál mantener.');
    } else {
      console.log('✅ No se encontraron duplicados');
    }

    console.log('\n✨ Migración completada exitosamente');
    
    return {
      usersTotal: users.length,
      usersUpdated,
      reservasTotal: reservas.length,
      reservasUpdated,
      duplicates: phoneGroups
    };

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

export { normalizePhones, normalizePhone };


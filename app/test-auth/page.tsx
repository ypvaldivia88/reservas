'use client';

import { useState } from 'react';

export default function AuthTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Initialize admin
      addResult('🧪 Test 1: Inicializar Admin...');
      const initRes = await fetch('/api/auth/init', { method: 'POST' });
      const initData = await initRes.json();
      addResult(`✅ Admin inicializado: ${initData.message}`);

      // Test 2: Login con credenciales correctas
      addResult('\n🧪 Test 2: Login con credenciales correctas...');
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin' })
      });
      const loginData = await loginRes.json();
      if (loginData.success) {
        addResult(`✅ Login exitoso: ${loginData.user.username} (${loginData.user.role})`);
      } else {
        addResult(`❌ Login falló: ${loginData.error}`);
      }

      // Test 3: Login con credenciales incorrectas
      addResult('\n🧪 Test 3: Login con credenciales incorrectas...');
      const badLoginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrong' })
      });
      const badLoginData = await badLoginRes.json();
      if (!badLoginData.success) {
        addResult(`✅ Login correctamente rechazado: ${badLoginData.error}`);
      } else {
        addResult(`❌ Login debería haber fallado`);
      }

      // Test 4: Crear reserva con nuevo cliente
      addResult('\n🧪 Test 4: Crear reserva con nuevo cliente...');
      const reservaRes = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Test Cliente',
          telefono: '+1 555 999 0001',
          forma: 'coffin',
          largo: 5,
          decoracion: 'Test decoration'
        })
      });
      const reservaData = await reservaRes.json();
      if (reservaData.success) {
        addResult(`✅ Reserva creada: ${reservaData.message}`);
      } else {
        addResult(`❌ Reserva falló: ${reservaData.error || reservaData.message}`);
      }

      // Test 5: Crear otra reserva con el mismo teléfono y nombre
      addResult('\n🧪 Test 5: Crear otra reserva con mismo cliente...');
      const reserva2Res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Test Cliente',
          telefono: '+1 555 999 0001',
          forma: 'almond',
          largo: 3,
          decoracion: 'Another test'
        })
      });
      const reserva2Data = await reserva2Res.json();
      if (reserva2Data.success) {
        addResult(`✅ Segunda reserva creada correctamente (cliente existente)`);
      } else {
        addResult(`❌ Segunda reserva falló: ${reserva2Data.error || reserva2Data.message}`);
      }

      // Test 6: Intentar crear reserva con mismo teléfono pero diferente nombre
      addResult('\n🧪 Test 6: Intentar reserva con mismo teléfono pero diferente nombre...');
      const reserva3Res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Different Name',
          telefono: '+1 555 999 0001',
          forma: 'stiletto',
          largo: 7,
          decoracion: 'Should fail'
        })
      });
      const reserva3Data = await reserva3Res.json();
      if (!reserva3Data.success) {
        addResult(`✅ Reserva correctamente rechazada: ${reserva3Data.message}`);
      } else {
        addResult(`❌ Reserva debería haber sido rechazada`);
      }

      // Test 7: Obtener lista de clientes
      addResult('\n🧪 Test 7: Obtener lista de clientes...');
      const clientesRes = await fetch('/api/clientes');
      const clientesData = await clientesRes.json();
      if (clientesData.success) {
        addResult(`✅ Clientes obtenidos: ${clientesData.data.length} cliente(s)`);
      } else {
        addResult(`❌ Error obteniendo clientes: ${clientesData.error}`);
      }

      // Test 8: Obtener lista de reservas
      addResult('\n🧪 Test 8: Obtener lista de reservas...');
      const reservasRes = await fetch('/api/reservas');
      const reservasData = await reservasRes.json();
      if (reservasData.success) {
        addResult(`✅ Reservas obtenidas: ${reservasData.data.length} reserva(s)`);
      } else {
        addResult(`❌ Error obteniendo reservas: ${reservasData.error}`);
      }

      addResult('\n🎉 ¡Todos los tests completados!');

    } catch (error) {
      addResult(`\n❌ Error durante los tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          🧪 Test del Sistema de Autenticación
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Este test verifica el funcionamiento completo del sistema de autenticación y registro:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 mb-6">
            <li>Inicialización del usuario admin</li>
            <li>Login con credenciales correctas e incorrectas</li>
            <li>Registro automático de clientes</li>
            <li>Validación de unicidad de teléfono</li>
            <li>Prevención de duplicados con diferentes nombres</li>
            <li>Consulta de clientes y reservas</li>
          </ul>
          
          <button
            onClick={runAllTests}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white px-6 py-3 rounded-lg hover:shadow-lg disabled:opacity-50 transition-all font-semibold"
          >
            {loading ? '🔄 Ejecutando Tests...' : '🚀 Ejecutar Todos los Tests'}
          </button>
        </div>
        
        {testResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Resultados:
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100 font-mono">
              {testResults.join('\n')}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

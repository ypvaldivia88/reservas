'use client';

import { useState } from 'react';

export default function TestPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      const response = await fetch('/api/reservas', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ Conexión exitosa! Reservas encontradas: ${JSON.stringify(data, null, 2)}`);
      } else {
        const error = await response.text();
        setTestResult(`❌ Error en respuesta: ${response.status} - ${error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error de conexión: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">🧪 Test MongoDB Connection</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '🔄 Probando...' : '🚀 Probar Conexión'}
        </button>
        
        {testResult && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">Resultado:</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm whitespace-pre-wrap">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

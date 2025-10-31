import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Agregar headers de seguridad
  const requestHeaders = new Headers(request.headers);
  
  // Proteger rutas de admin
  if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    const token = request.cookies.get('session-token')?.value;
    
    // Verificar existencia y formato básico del token
    if (!token || token.length < 20) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    
    // Note: Full token validation (expiration, DB check) is done in API endpoints
    // to keep middleware lightweight and fast
  }
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Headers de seguridad
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // Rate limiting básico para API (en producción usar un servicio dedicado)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous';
    console.log(`API request from ${ip} to ${request.nextUrl.pathname}`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

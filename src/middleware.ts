import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/login',
  '/manifest.json',
  '/icon512_rounded.png',
  '/_next',
  '/favicon.ico',
];

// Check if the path is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

// Simple JWT verification for Edge Runtime
async function verifyAuthToken(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return false;
    }

    if (!JWT_SECRET) {
      return false;
    }

    // Basic JWT structure check
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    try {
      // Decode payload (no verification for now, just check structure and expiration)
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token has expired
      if (payload.exp && payload.exp < now) {
        return false;
      }
      
      // Check if token has required fields
      if (!payload.username) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const isAuthenticated = await verifyAuthToken(request);

  if (!isAuthenticated) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
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
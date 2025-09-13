import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// WARNING: It is strongly recommended to use a secure database with hashed passwords for production environments.
const JWT_SECRET = process.env.JWT_SECRET!;
const AUTH_USERNAME = process.env.AUTH_USERNAME!;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD!;

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_PERIOD = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0];
  const now = Date.now();

  const attemptInfo = loginAttempts.get(ip);

  if (attemptInfo && now - attemptInfo.lastAttempt < LOCKOUT_PERIOD && attemptInfo.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { success: false, error: 'Too many failed login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (!JWT_SECRET || !AUTH_USERNAME || !AUTH_PASSWORD) {
      console.error('Server configuration error: Missing JWT_SECRET, AUTH_USERNAME, or AUTH_PASSWORD');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
      loginAttempts.delete(ip); // Clear attempts on successful login

      const token = jwt.sign(
        { 
          username,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        },
        JWT_SECRET
      );

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      return response;
    }

    const newAttemptInfo = {
      count: (attemptInfo?.count || 0) + 1,
      lastAttempt: now,
    };
    loginAttempts.set(ip, newAttemptInfo);

    console.warn(`Invalid login attempt for username: ${username} from IP: ${ip}`);
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
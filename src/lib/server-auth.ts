import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthUser {
  username: string;
}

export async function getServerAuthState(): Promise<{
  isAuthenticated: boolean;
  user?: AuthUser;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token || !JWT_SECRET) {
      return { isAuthenticated: false };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    
    return {
      isAuthenticated: true,
      user: { username: decoded.username },
    };
  } catch {
    return { isAuthenticated: false };
  }
}
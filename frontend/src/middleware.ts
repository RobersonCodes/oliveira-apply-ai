import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Não protege nada aqui — o cookie de sessão pertence ao domínio do backend
  // (Railway), não ao domínio deste frontend (Vercel), então o middleware do
  // Next.js não tem como ler o cookie de autenticação. A checagem acontece no
  // cliente via chamada a /auth/me (ver useAuthStore.fetchMe).
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Não protege nada por enquanto — deixa o cliente verificar
  // O token está no localStorage, não no cookie
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
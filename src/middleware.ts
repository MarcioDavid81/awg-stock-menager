import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecretKey } from "../lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("awg-stock-menager-token")?.value;

  console.log("[middleware] Path:", pathname);
  console.log("[middleware] Token presente?", !!token);

  const publicPaths = ["/", "/login"];

  if (publicPaths.includes(pathname)) {
    if (token) {
      try {
        await jwtVerify(token, getJwtSecretKey());
        console.log("[middleware] Token válido, redirecionando para /dashboard");
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (err) {
        console.log("[middleware] Token inválido, continua na página pública", err);
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    console.log("[middleware] Sem token, redirecionando para login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, getJwtSecretKey());
    console.log("[middleware] Token válido, acesso liberado");
    return NextResponse.next();
  } catch (err) {
    console.log("[middleware] Token inválido, redirecionando para login", err);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [ "/dashboard", "/entradas", "/estoque", "/fornecedores", "/produtos", "/saidas", "/talhoes" ],
};

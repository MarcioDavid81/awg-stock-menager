import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { getJwtSecretKey } from "../lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("awg-stock-menager-token")?.value;

  console.log("[middleware] Path:", pathname);
  console.log("[middleware] Token presente?", !!token);

  // Páginas que não requerem autenticação
  const publicPaths = ["/"];

  // Página de login - redireciona para dashboard se já estiver logado
  if (pathname === "/login") {
    if (token) {
      try {
        await jwtVerify(token, getJwtSecretKey());
        console.log(
          "[middleware] Usuário já logado, redirecionando para /dashboard"
        );
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (err) {
        console.log(
          "[middleware] Token inválido, permitindo acesso ao login",
          err
        );
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // Outras páginas públicas
  if (publicPaths.includes(pathname)) {
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
  matcher: [
    "/login",
    "/dashboard",
    "/entradas",
    "/estoque",
    "/fornecedores",
    "/produtos",
    "/saidas",
    "/talhoes",
    "/usuarios",
  ],
};

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logout bem-sucedido" });

  // Limpar o cookie do token
  response.cookies.set("awg-stock-menager-token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0), // Define uma data de expiração no passado, efetivamente removendo o cookie
  });

  return response;
}
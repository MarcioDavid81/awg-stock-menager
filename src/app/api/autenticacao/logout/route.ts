/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { destroyCookie } from "nookies";

export async function POST(request: NextRequest) {
  destroyCookie({ res: NextResponse.next() }, "awg-stock-menager-token", {
    path: "/",
  });
  const response = NextResponse.json({ message: "Logout bem-sucedido" });
  
  response.cookies.set("awg-stock-menager-token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return response;
}
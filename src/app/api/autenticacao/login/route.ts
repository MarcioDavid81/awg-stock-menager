import { compare } from "bcrypt";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";
import { setCookie } from "nookies";

const JWT_SECRET = process.env.JWT_SECRET!;

function getJwtSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
    include: {
      company: true,
    },
  });
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: "Usuário não encontrado",
      },
      { status: 404 }
    );
  }
  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json(
      {
        success: false,
        error: "Senha inválida",
      },
      { status: 401 }
    );
  }
  const token = await new SignJWT({
    userId: user.id,
    companyId: user.companyId,
  })
  .setProtectedHeader({
    alg: "HS256",
    typ: "JWT",
  })
  .setExpirationTime("1h")
  .sign(getJwtSecretKey());
  const response = NextResponse.json(
    {
      success: true,
      token: token,
      message: "Usuário logado com sucesso",
    },
    { status: 200 }
  );
  setCookie({ res: response }, "awg-stock-menager-token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60,
  })
  return response;
}

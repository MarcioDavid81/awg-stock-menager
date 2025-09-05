import z from "zod";
import { verifyToken } from "../../../../lib/auth";
import { PrismaClient } from "../../../generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

const createFazendaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  area: z.number().min(1, "Area é obrigatória"),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Token não enviado ou mal formatado" },
      { status: 401 }
    );
  }
  const token = authHeader.split(" ")[1];
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  const { userId, companyId } = payload;

  try {
    const body = await req.json();
    const validatedData = createFazendaSchema.parse(body);
    const fazenda = await prisma.farm.create({
      data: {
        name: validatedData.name,
        area: validatedData.area,
        userId: userId,
        companyId: companyId,
      },
    });
    return NextResponse.json({ success: true, data: fazenda }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar fazenda:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar fazenda" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Token não enviado ou mal formatado" },
      { status: 401 }
    );
  }
  const token = authHeader.split(" ")[1];
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  const { companyId } = payload;
  try {
    const fazendas = await prisma.farm.findMany({
      where: {
        companyId: companyId,
      },
      include: {
        talhoes: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json({ success: true, data: fazendas }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar fazendas:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar fazendas" },
      { status: 500 }
    );
  }
}

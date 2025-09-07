import z from "zod";
import { PrismaClient } from "../../../generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from '../../../../lib/api-auth';

const prisma = new PrismaClient();

const createFazendaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  area: z.number().min(1, "Area é obrigatória"),
});

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (!authResult.success) {
    return authResult.response;
  }
  if (!authResult.payload) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  const { userId, companyId } = authResult.payload;

  try {
    const body = await req.json();
    const validatedData = createFazendaSchema.parse(body);
    const fazenda = await prisma.farm.create({
      data: {
        ...validatedData,
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
  const authResult = await authenticateRequest(req);
  if (!authResult.success) {
    return authResult.response;
  }
  if (!authResult.payload) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  const { companyId } = authResult.payload;
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

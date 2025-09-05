import z from "zod";
import { verifyToken } from "../../../../../lib/auth";
import { PrismaClient } from "../../../../generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

const updateFazendaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  area: z.number().min(1, "Area é obrigatória"),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID da fazenda não fornecido" },
      { status: 400 }
    );
  }
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
  const body = await req.json();
  const validatedData = updateFazendaSchema.parse(body);
  try {
    const existingFarm = await prisma.farm.findUnique({
      where: {
        id: id,
        userId: userId,
        companyId: companyId,
      },
    });
    if (!existingFarm) {
      return NextResponse.json(
        { error: "Fazenda não encontrada" },
        { status: 404 }
      );
    }
    const fazenda = await prisma.farm.update({
      where: {
        id: id,
        userId: userId,
        companyId: companyId,
      },
      data: {
        name: validatedData.name,
        area: validatedData.area,
      },
    });
    return NextResponse.json({ success: true, data: fazenda }, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar fazenda:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar fazenda" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID da fazenda não fornecido" },
      { status: 400 }
    );
  }
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
    const fazenda = await prisma.farm.delete({
      where: {
        id: id,
        userId: userId,
        companyId: companyId,
      },
    });
    return NextResponse.json({ success: true, data: fazenda }, { status: 200 });
  } catch (error) {
    console.error("Erro ao deletar fazenda:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao deletar fazenda" },
      { status: 500 }
    );
  }
}

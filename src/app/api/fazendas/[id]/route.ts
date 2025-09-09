import z from "zod";
import { PrismaClient } from "../../../../generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../../../../../lib/api-auth";

const prisma = new PrismaClient();

const updateFazendaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  area: z.number().optional(),
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
  const {   companyId } = authResult.payload;
  const body = await req.json();
  const validatedData = updateFazendaSchema.parse(body);
  try {
    const existingFarm = await prisma.farm.findUnique({
      where: {
        id: id,
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
    const fazenda = await prisma.farm.delete({
      where: {
        id: id,
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

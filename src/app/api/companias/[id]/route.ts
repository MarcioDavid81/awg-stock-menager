import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";
import { z } from "zod";

const prisma = new PrismaClient();

const updateCompanySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  cpf: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: {
        id: id,
      },
    });
    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: "Empresa não encontrada",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        data: company,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar empresa",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = updateCompanySchema.parse(body);
    const existCompany = await prisma.company.findFirst({
      where: {
        id: id,
      }
    });
    if (!existCompany) {
      return NextResponse.json(
        {
          success: false,
          error: "Empresa não encontrada",
        },
        { status: 404 }
      );
    }
    const company = await prisma.company.update({
      where: {
        id: id,
      },
      data: validatedData,
    });
    return NextResponse.json(
      {
        success: true,
        data: company,
        message: "Empresa atualizada com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: error,
        },
        { status: 400 }
      );
    }
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao atualizar empresa",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existCompany = await prisma.company.findFirst({
      where: {
        id: id,
      }
    });
    if (!existCompany) {
      return NextResponse.json(
        {
          success: false,
          error: "Empresa não encontrada",
        },
        { status: 404 }
      );
    }
    const company = await prisma.company.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json(
      {
        success: true,
        data: company,
        message: "Empresa deletada com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar empresa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao deletar empresa",
      },
      { status: 500 }
    );
  }
}

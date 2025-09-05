/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";
import { z } from "zod";

const prisma = new PrismaClient();

const createCompanySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  cpf: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validateData = createCompanySchema.parse(body);
    const existCompany = await prisma.company.findFirst({
      where: {
        OR: [{ cnpj: validateData.cnpj }, { cpf: validateData.cpf }],
      },
    });
    if (existCompany) {
      return NextResponse.json({
        success: false,
        error: "Empresa já cadastrada",
      });
    }
    const company = await prisma.company.create({
      data: validateData,
    });
    return NextResponse.json(
      {
        success: true,
        data: company,
        message: "Empresa criada com sucesso",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          datails: error.issues,
        },
        { status: 400 }
      );
    }
    console.error("Erro ao criar empresa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao criar empresa",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const where: any  = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefone: { contains: search, mode: 'insensitive' } },
        { endereco: { contains: search, mode: 'insensitive' } },
      ];
    }


    const companias = await prisma.company.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json({
      success: true,
      data: companias,
      message: "Empresas buscadas com sucesso",
      pagination: {
        page,
        limit,
        total: companias.length,
        totalPages: Math.ceil(companias.length / limit),
      },
    })
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar empresas",
      },
      { status: 500 }
    );
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { validarCNPJ, validarCPF } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken } from "../../../../lib/auth";
import { PrismaClient } from "../../../generated/prisma";

const prisma = new PrismaClient();



// Schema de validação para criação de fornecedor
const createFornecedorSchema = z
  .object({
    nome: z.string().min(1, "Nome é obrigatório"),
    cnpj: z
      .string()
      .optional()
      .refine((val) => {
        if (!val || val.trim() === "") return true;
        return validarCNPJ(val);
      }, "CNPJ inválido"),
    cpf: z
      .string()
      .optional()
      .refine((val) => {
        if (!val || val.trim() === "") return true;
        return validarCPF(val);
      }, "CPF inválido"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    telefone: z.string().optional(),
    endereco: z.string().optional(),
    ativo: z.boolean().default(true),
  })
  .refine(
    (data) => {
      const hasCnpj = data.cnpj && data.cnpj.trim() !== "";
      const hasCpf = data.cpf && data.cpf.trim() !== "";
      return hasCnpj || hasCpf;
    },
    {
      message: "É necessário informar CPF ou CNPJ",
      path: ["cnpj"],
    }
  )
  .refine(
    (data) => {
      const hasCnpj = data.cnpj && data.cnpj.trim() !== "";
      const hasCpf = data.cpf && data.cpf.trim() !== "";
      return !(hasCnpj && hasCpf);
    },
    {
      message: "Informe apenas CPF ou CNPJ, não ambos",
      path: ["cnpj"],
    }
  );

// POST - Criar novo fornecedor
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
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
    const body = await request.json();

    // Validar dados de entrada
    const validatedData = createFornecedorSchema.parse(body);

    // Verificar se já existe fornecedor com mesmo CNPJ ou CPF
    const whereConditions = [];

    if (validatedData.cnpj && validatedData.cnpj.trim() !== "") {
      whereConditions.push({ cnpj: validatedData.cnpj.trim() });
    }

    if (validatedData.cpf && validatedData.cpf.trim() !== "") {
      whereConditions.push({ cpf: validatedData.cpf.trim() });
    }

    if (whereConditions.length > 0) {
      const existingFornecedor = await prisma.fornecedor.findFirst({
        where: {
          OR: whereConditions,
          companyId: companyId,
        },
      });

      if (existingFornecedor) {
        const documento = existingFornecedor.cnpj ? "CNPJ" : "CPF";
        return NextResponse.json(
          {
            success: false,
            error: `Já existe nesta empresa um fornecedor com este ${documento}`,
          },
          { status: 400 }
        );
      }
    }

    // Normalizar dados antes de salvar (converter strings vazias para null)
    const normalizedData = {
      ...validatedData,
      cnpj:
        validatedData.cnpj && validatedData.cnpj.trim() !== ""
          ? validatedData.cnpj.trim()
          : null,
      cpf:
        validatedData.cpf && validatedData.cpf.trim() !== ""
          ? validatedData.cpf.trim()
          : null,
      email:
        validatedData.email && validatedData.email.trim() !== ""
          ? validatedData.email.trim()
          : null,
      telefone:
        validatedData.telefone && validatedData.telefone.trim() !== ""
          ? validatedData.telefone.trim()
          : null,
      endereco:
        validatedData.endereco && validatedData.endereco.trim() !== ""
          ? validatedData.endereco.trim()
          : null,
    };

    // Criar fornecedor
    const fornecedor = await prisma.fornecedor.create({
      data: {
        ...normalizedData,
        userId: userId,
        companyId: companyId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: fornecedor,
        message: "Fornecedor criado com sucesso",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);

    if (error instanceof z.ZodError) {
      console.log(
        "POST /api/fornecedores - Erro de validação Zod:",
        JSON.stringify(error.issues, null, 2)
      );
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.log("POST /api/fornecedores - Erro não tratado:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// GET - Listar todos os fornecedores
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
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
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get("ativo");
    const search = searchParams.get("search");
    const tipo = searchParams.get("tipo"); // 'pf' para pessoa física, 'pj' para pessoa jurídica
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};
    where.companyId = companyId;

    if (ativo !== null) {
      where.ativo = ativo === "true";
    }

    if (tipo === "pf") {
      where.cpf = { not: null };
    } else if (tipo === "pj") {
      where.cnpj = { not: null };
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { cnpj: { contains: search, mode: "insensitive" } },
        { cpf: { contains: search, mode: "insensitive" } },
      ];
    }

    // Contar total de registros
    const total = await prisma.fornecedor.count({ where });

    // Buscar fornecedores com paginação
    const fornecedores = await prisma.fornecedor.findMany({
      where,
      include: {
        _count: {
          select: {
            entradas: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: fornecedores,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

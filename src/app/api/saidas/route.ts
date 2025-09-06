/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";
import { z } from "zod";
import { verifyToken } from "../../../../lib/auth";

const prisma = new PrismaClient();

// Schema de validação para criação de saída
const createSaidaSchema = z
  .object({
    tipo: z.enum(["APLICACAO", "TRANSFERENCIA_NEGATIVA"]),
    quantidade: z.number().positive("Quantidade deve ser um número positivo"),
    observacoes: z.string().optional(),
    dataSaida: z.string().optional(),
    produtoId: z.string().min(1, "ID do produto é obrigatório"),
    talhaoId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tipo === "APLICACAO" && !data.talhaoId) {
        return false;
      }
      return true;
    },
    {
      message: "Talhão é obrigatório para aplicações",
      path: ["talhaoId"],
    }
  );

// POST - Criar nova saída
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
  const { companyId, userId } = payload;
  try {
    const body = await request.json();

    // Validar dados de entrada
    const validatedData = createSaidaSchema.parse(body);

    // Verificar se o produto existe
    const produto = await prisma.produto.findUnique({
      where: {
        id: validatedData.produtoId,
        companyId,
      },
    });

    if (!produto) {
      return NextResponse.json(
        {
          success: false,
          error: "Produto não encontrado",
        },
        { status: 404 }
      );
    }

    // Verificar se o talhão existe (se fornecido)
    if (validatedData.talhaoId) {
      const talhao = await prisma.talhao.findUnique({
        where: { 
          id: validatedData.talhaoId,
          companyId,
        },
      });

      if (!talhao) {
        return NextResponse.json(
          {
            success: false,
            error: "Talhão não encontrado",
          },
          { status: 404 }
        );
      }
    }

    // Verificar estoque disponível
    const estoque = await prisma.estoque.findUnique({
      where: { 
        produtoId: validatedData.produtoId,
        companyId,
      },
    });

    if (!estoque || estoque.quantidade < validatedData.quantidade) {
      return NextResponse.json(
        {
          success: false,
          error: "Estoque insuficiente para esta operação",
          estoqueDisponivel: estoque?.quantidade || 0,
        },
        { status: 400 }
      );
    }

    // Prosseguir com a criação da saída

    // Usar transação para garantir consistência
    const resultado = await prisma.$transaction(async (tx: any) => {
      // Criar saída
      const saida = await tx.saida.create({
        data: {
          ...validatedData,
          userId,
          companyId,
          dataSaida: validatedData.dataSaida
            ? new Date(validatedData.dataSaida)
            : new Date(),
        },
        include: {
          produto: true,
          talhao: true,
        },
      });

      // Atualizar estoque
      await tx.estoque.update({
        where: { 
          produtoId: validatedData.produtoId,
          companyId,
        },
        data: {
          quantidade: estoque.quantidade - validatedData.quantidade,
          ultimaAtualizacao: new Date(),
        },
      });

      return saida;
    });

    return NextResponse.json(
      {
        success: true,
        data: resultado,
        message: "Saída criada com sucesso",
      },
      { status: 201 }
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

    console.error("Erro ao criar saída:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// GET - Listar saídas com filtros
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

    // Parâmetros de filtro
    const tipo = searchParams.get("tipo");
    const produtoId = searchParams.get("produtoId");
    const talhaoId = searchParams.get("talhaoId");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    where.companyId = companyId;

    if (tipo && ["APLICACAO", "TRANSFERENCIA_NEGATIVA"].includes(tipo)) {
      where.tipo = tipo;
    }

    if (produtoId) {
      where.produtoId = produtoId;
    }

    if (talhaoId) {
      where.talhaoId = talhaoId;
    }

    if (dataInicio || dataFim) {
      where.dataSaida = {};
      if (dataInicio) {
        where.dataSaida.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataSaida.lte = new Date(dataFim);
      }
    }

    // Buscar saídas com paginação
    const [saidas, total] = await Promise.all([
      prisma.saida.findMany({
        where,
        include: {
          produto: {
            select: {
              id: true,
              nome: true,
              categoria: true,
              unidade: true,
              codigoBarras: true,
            },
          },
          talhao: {
            select: {
              id: true,
              nome: true,
              area: true,
              localizacao: true,
            },
          },
        },
        orderBy: {
          dataSaida: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.saida.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: saidas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar saídas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

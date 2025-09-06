/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken } from "../../../../../lib/auth";
import { PrismaClient } from "../../../../generated/prisma";

const prisma = new PrismaClient();

// Schema de validação para atualização de saída
const updateSaidaSchema = z
  .object({
    tipo: z.enum(["APLICACAO", "TRANSFERENCIA_NEGATIVA"]).optional(),
    quantidade: z
      .number()
      .positive("Quantidade deve ser um número positivo")
      .optional(),
    observacoes: z.string().optional(),
    dataSaida: z.string().optional(),
    produtoId: z.string().optional(),
    talhaoId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tipo === "APLICACAO" && data.talhaoId === null) {
        return false;
      }
      return true;
    },
    {
      message: "Talhão é obrigatório para aplicações",
      path: ["talhaoId"],
    }
  );

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Função para reverter estoque após exclusão/alteração de saída
async function reverterEstoque(
  produtoId: string,
  companyId: string,
  quantidade: number
) {
  const estoque = await prisma.estoque.findUnique({
    where: { produtoId, companyId },
  });

  if (estoque) {
    await prisma.estoque.update({
      where: { produtoId, companyId },
      data: {
        quantidade: estoque.quantidade + quantidade,
        ultimaAtualizacao: new Date(),
      },
    });
  } else {
    // Criar estoque se não existir
    await prisma.estoque.create({
      data: {
        produtoId,
        companyId,
        quantidade,
        valorMedio: 0,
      },
    });
  }
}

// Função para aplicar nova saída no estoque
async function aplicarSaidaEstoque(
  produtoId: string,
  companyId: string,
  quantidade: number
) {
  const estoque = await prisma.estoque.findUnique({
    where: { produtoId, companyId },
  });

  if (!estoque || estoque.quantidade < quantidade) {
    throw new Error("Estoque insuficiente para esta operação");
  }

  await prisma.estoque.update({
    where: { produtoId, companyId },
    data: {
      quantidade: estoque.quantidade - quantidade,
      ultimaAtualizacao: new Date(),
    },
  });
}

// GET - Buscar saída por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID do fornecedor não fornecido" },
      { status: 400 }
    );
  }
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
    const saida = await prisma.saida.findUnique({
      where: {
        id,
        companyId,
      },
      include: {
        produto: {
          include: {
            estoques: true,
          },
        },
        talhao: true,
      },
    });

    if (!saida) {
      return NextResponse.json(
        {
          success: false,
          error: "Saída não encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: saida,
    });
  } catch (error) {
    console.error("Erro ao buscar saída:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar saída
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID da entrada não fornecido" },
      { status: 400 }
    );
  }
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
    const validatedData = updateSaidaSchema.parse(body);

    // Verificar se a saída existe e pertence à empresa
    const existingSaida = await prisma.saida.findUnique({
      where: {
        id,
        userId,
        companyId,
      },
    });

    if (!existingSaida) {
      return NextResponse.json(
        {
          success: false,
          error: "Saída não encontrada ou não pertence ao usuário e à empresa",
        },
        { status: 404 }
      );
    }

    // Verificar se o produto existe (se fornecido)
    if (validatedData.produtoId) {
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
            error: "Produto não encontrado ou não pertence à empresa",
          },
          { status: 404 }
        );
      }
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
            error: "Talhão não encontrado ou não pertence à empresa",
          },
          { status: 404 }
        );
      }
    }

    // Verificar estoque disponível para a nova quantidade (se alterada)
    const produtoIdFinal = validatedData.produtoId || existingSaida.produtoId;
    const quantidadeFinal =
      validatedData.quantidade || existingSaida.quantidade;

    const estoque = await prisma.estoque.findUnique({
      where: {
        produtoId: produtoIdFinal,
        companyId,
      },
    });

    // Calcular estoque disponível considerando a reversão da saída atual
    const estoqueDisponivel =
      (estoque?.quantidade || 0) + existingSaida.quantidade;

    if (estoqueDisponivel < quantidadeFinal) {
      return NextResponse.json(
        {
          success: false,
          error: "Estoque insuficiente para esta operação",
          estoqueDisponivel,
        },
        { status: 400 }
      );
    }

    // Usar transação para garantir consistência
    const resultado = await prisma.$transaction(async (tx: any) => {
      // Reverter estoque da saída original
      await reverterEstoque(
        existingSaida.produtoId,
        companyId,
        existingSaida.quantidade
      );

      // Atualizar saída
      const saida = await tx.saida.update({
        where: {
          id,
          userId,
          companyId,
        },
        data: {
          ...validatedData,
          dataSaida: validatedData.dataSaida
            ? new Date(validatedData.dataSaida)
            : undefined,
        },
        include: {
          produto: true,
          talhao: true,
        },
      });

      // Aplicar nova saída no estoque
      await aplicarSaidaEstoque(saida.produtoId, companyId, saida.quantidade);

      return saida;
    });

    return NextResponse.json({
      success: true,
      data: resultado,
      message: "Saída atualizada com sucesso",
    });
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

    if (
      error instanceof Error &&
      error.message === "Estoque insuficiente para esta operação"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar saída:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// DELETE - Excluir saída
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID da entrada não fornecido" },
      { status: 400 }
    );
  }

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
    // Verificar se a saída existe
    const existingSaida = await prisma.saida.findUnique({
      where: {
        id,
        userId,
        companyId,
      },
    });

    if (!existingSaida) {
      return NextResponse.json(
        {
          success: false,
          error: "Saída não encontrada ou não pertence ao usuário e à empresa",
        },
        { status: 404 }
      );
    }

    // Usar transação para garantir consistência
    await prisma.$transaction(async (tx: any) => {
      // Reverter estoque
      await reverterEstoque(
        existingSaida.produtoId,
        companyId,
        existingSaida.quantidade
      );

      // Excluir saída
      await tx.saida.delete({
        where: {
          id,
          userId,
          companyId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Saída excluída com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir saída:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";
import { z } from "zod";
import { verifyToken } from "../../../../../lib/auth";

const prisma = new PrismaClient();

// Schema de validação para atualização de entrada
const updateEntradaSchema = z
  .object({
    tipo: z.enum(["COMPRA", "TRANSFERENCIA_POSITIVA"]).optional(),
    quantidade: z
      .number()
      .positive("Quantidade deve ser um número positivo")
      .optional(),
    valorUnitario: z
      .number()
      .positive("Valor unitário deve ser um número positivo")
      .optional(),
    valorTotal: z
      .number()
      .positive("Valor total deve ser um número positivo")
      .optional(),
    numeroNota: z.string().optional(),
    observacoes: z.string().optional(),
    dataEntrada: z.string().optional(),
    produtoId: z.string().optional(),
    fornecedorId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tipo === "COMPRA" && data.fornecedorId === null) {
        return false;
      }
      return true;
    },
    {
      message: "Fornecedor é obrigatório para compras",
      path: ["fornecedorId"],
    }
  );

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Função para reverter estoque após exclusão/alteração de entrada
async function reverterEstoque(
  produtoId: string,
  companyId: string,
  quantidade: number,
  valorUnitario?: number
) {
  const estoque = await prisma.estoque.findUnique({
    where: { produtoId, companyId },
  });

  if (estoque) {
    const novaQuantidade = Math.max(0, estoque.quantidade - quantidade);

    // Recalcular valor médio se necessário
    let novoValorMedio = estoque.valorMedio || 0;

    if (valorUnitario && valorUnitario > 0 && estoque.quantidade > quantidade) {
      const valorTotalAnterior = (estoque.valorMedio || 0) * estoque.quantidade;
      const valorTotalRemovido = valorUnitario * quantidade;
      const quantidadeRestante = estoque.quantidade - quantidade;

      novoValorMedio =
        quantidadeRestante > 0
          ? Math.max(
              0,
              (valorTotalAnterior - valorTotalRemovido) / quantidadeRestante
            )
          : 0;
    }

    await prisma.estoque.update({
      where: { produtoId },
      data: {
        quantidade: novaQuantidade,
        valorMedio: novoValorMedio,
        ultimaAtualizacao: new Date(),
      },
    });
  }
}

// Função para atualizar estoque após entrada
async function atualizarEstoque(
  produtoId: string,
  companyId: string,
  quantidade: number,
  valorUnitario?: number
) {
  const estoque = await prisma.estoque.findUnique({
    where: { produtoId, companyId },
  });

  if (!estoque) {
    await prisma.estoque.create({
      data: {
        produtoId,
        companyId,
        quantidade,
        valorMedio: valorUnitario || 0,
      },
    });
  } else {
    let novoValorMedio = estoque.valorMedio || 0;

    if (valorUnitario && valorUnitario > 0) {
      const valorTotalAnterior = (estoque.valorMedio || 0) * estoque.quantidade;
      const valorTotalNovo = valorUnitario * quantidade;
      const quantidadeTotal = estoque.quantidade + quantidade;

      novoValorMedio =
        quantidadeTotal > 0
          ? (valorTotalAnterior + valorTotalNovo) / quantidadeTotal
          : 0;
    }

    await prisma.estoque.update({
      where: { produtoId },
      data: {
        quantidade: estoque.quantidade + quantidade,
        valorMedio: novoValorMedio,
        ultimaAtualizacao: new Date(),
      },
    });
  }
}

// GET - Buscar entrada por ID
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
    const entrada = await prisma.entrada.findUnique({
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
        fornecedor: true,
      },
    });

    if (!entrada) {
      return NextResponse.json(
        {
          success: false,
          error: "Entrada não encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entrada,
    });
  } catch (error) {
    console.error("Erro ao buscar entrada:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar entrada
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
    const validatedData = updateEntradaSchema.parse(body);
    
    // Verificar se a entrada existe e pertence à empresa
    const existingEntrada = await prisma.entrada.findFirst({
      where: { 
        id,
        userId,
        companyId,
       },
    });

    if (!existingEntrada) {
      return NextResponse.json(
        {
          success: false,
          error: "Entrada não encontrada ou não pertence ao usuário e à empresa",
        },
        { status: 404 }
      );
    }

    // Verificar se o produto existe (se fornecido)
    if (validatedData.produtoId) {
      const produto = await prisma.produto.findFirst({
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

    // Verificar se o fornecedor existe (se fornecido)
    if (validatedData.fornecedorId) {
      const fornecedor = await prisma.fornecedor.findFirst({
        where: { 
          id: validatedData.fornecedorId, 
          companyId 
        },
      });

      if (!fornecedor) {
        return NextResponse.json(
          {
            success: false,
            error: "Fornecedor não encontrado ou não pertence à empresa",
          },
          { status: 404 }
        );
      }
    }

    // Calcular valor total se valor unitário for fornecido
    if (validatedData.valorUnitario && validatedData.quantidade) {
      validatedData.valorTotal =
        validatedData.valorUnitario * validatedData.quantidade;
    } else if (validatedData.valorUnitario && !validatedData.quantidade) {
      validatedData.valorTotal =
        validatedData.valorUnitario * existingEntrada.quantidade;
    } else if (
      !validatedData.valorUnitario &&
      validatedData.quantidade &&
      existingEntrada.valorUnitario
    ) {
      validatedData.valorTotal =
        existingEntrada.valorUnitario * validatedData.quantidade;
    }

    // Usar transação para garantir consistência
    const resultado = await prisma.$transaction(async (tx: any) => {
      // Reverter estoque da entrada original
      await reverterEstoque(
        existingEntrada.produtoId,
        companyId,
        existingEntrada.quantidade,
        existingEntrada.valorUnitario || undefined
      );

      // Atualizar entrada
      const entrada = await tx.entrada.update({
        where: { 
          id,
         },
        data: {
          ...validatedData,
          dataEntrada: validatedData.dataEntrada
            ? new Date(validatedData.dataEntrada)
            : undefined,
        },
        include: {
          produto: true,
          fornecedor: true,
        },
      });

      // Aplicar novo estoque
      await atualizarEstoque(
        entrada.produtoId,
        companyId,
        entrada.quantidade,
        entrada.valorUnitario || undefined
      );

      return entrada;
    });

    return NextResponse.json({
      success: true,
      data: resultado,
      message: "Entrada atualizada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar entrada:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// DELETE - Excluir entrada
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
    // Verificar se a entrada existe e pertence ao usuário e à empresa
    const existingEntrada = await prisma.entrada.findFirst({
      where: { 
        id,
        userId,
        companyId,
      },
    });

    if (!existingEntrada) {
      return NextResponse.json(
        {
          success: false,
          error: "Entrada não encontrada ou não pertence ao usuário e à empresa",
        },
        { status: 404 }
      );
    }

    // Verificar se há estoque suficiente para reverter
    const estoque = await prisma.estoque.findFirst({
      where: { 
        produtoId: existingEntrada.produtoId,
        companyId,
      },
    });

    if (estoque && estoque.quantidade < existingEntrada.quantidade) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Não é possível excluir esta entrada. Estoque insuficiente para reverter a operação.",
        },
        { status: 400 }
      );
    }

    // Usar transação para garantir consistência
    await prisma.$transaction(async (tx: any) => {
      // Reverter estoque
      await reverterEstoque(
        existingEntrada.produtoId,
        companyId,
        existingEntrada.quantidade,
        existingEntrada.valorUnitario || undefined
      );

      // Excluir entrada
      await tx.entrada.delete({
        where: { 
          id,
          userId,
          companyId,
         },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Entrada excluída com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir entrada:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';
import { authenticateRequest } from '../../../../../lib/api-auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.success) {
    return auth.response!;
  }
  const { companyId } = auth.payload!;
  try {
    // Buscar produtos com estoque baixo
    const estoques = await prisma.estoque.findMany({
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            categoria: true,
            unidade: true,
          },
        },
      },
      where: {
        companyId,
        produto: {
          ativo: true,
        },
      },
    });

    // Filtrar produtos com estoque baixo e calcular diferença
    const estoqueBaixo = estoques
      .filter((estoque) => {
        const quantidadeMinima = estoque.quantidadeMinima || 0;
        return estoque.quantidade <= quantidadeMinima;
      })
      .map((estoque) => {
        const quantidadeMinima = estoque.quantidadeMinima || 0;
        return {
          produto: estoque.produto,
          quantidadeAtual: estoque.quantidade,
          quantidadeMinima,
          diferenca: quantidadeMinima - estoque.quantidade
        };
      })
      .sort((a, b) => b.diferenca - a.diferenca); // Ordenar por maior diferença

    return NextResponse.json({
      success: true,
      data: estoqueBaixo
    });
  } catch (error) {
    console.error('Erro ao buscar produtos com estoque baixo:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
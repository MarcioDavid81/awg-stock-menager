/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from "../../../../../lib/auth";
import prisma from '../../../../../lib/prisma';

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
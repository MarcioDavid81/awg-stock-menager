import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { Estoque } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    // Obter estatísticas do dashboard
    const [totalProdutos, totalTalhoes, totalFornecedores, estoques, entradas, saidas] = await Promise.all([
      prisma.produto.count({ where: { ativo: true } }),
      prisma.talhao.count({ where: { ativo: true } }),
      prisma.fornecedor.count({ where: { ativo: true } }),
      prisma.estoque.findMany({
        include: {
          produto: true
        }
      }),
      prisma.entrada.findMany({
        where: {
          dataEntrada: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.saida.findMany({
        where: {
          dataSaida: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    // Calcular produtos com estoque baixo
    const produtosEstoqueBaixo = estoques.filter((estoque) => {
      const quantidadeMinima = estoque.quantidadeMinima || 0;
      return estoque.quantidade <= quantidadeMinima;
    }).length;

    // Calcular valor total do estoque
    const valorTotalEstoque = estoques.reduce((total: number, estoque) => {
      const valorMedio = estoque.valorMedio || 0;
      return total + (estoque.quantidade * valorMedio);
    }, 0);

    const stats = {
      totalProdutos,
      totalTalhoes,
      totalFornecedores,
      produtosEstoqueBaixo,
      entradasMes: entradas.length,
      saidasMes: saidas.length,
      valorTotalEstoque
    };

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { Entrada, Saida } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Buscar entradas recentes
    const entradas = await prisma.entrada.findMany({
      take: limit,
      orderBy: {
        dataEntrada: 'desc'
      },
      include: {
        produto: {
          select: {
            nome: true
          }
        }
      }
    });

    // Buscar saídas recentes
    const saidas = await prisma.saida.findMany({
      take: limit,
      orderBy: {
        dataSaida: 'desc'
      },
      include: {
        produto: {
          select: {
            nome: true
          }
        }
      }
    });

    // Combinar e formatar movimentações
    const movimentacoes = [
      ...entradas.map((entrada: any) => ({
        id: entrada.id,
        tipo: 'entrada' as const,
        produto: entrada.produto.nome,
        quantidade: entrada.quantidade,
        data: entrada.dataEntrada,
        observacoes: entrada.observacoes || `${entrada.tipo.replace('_', ' ').toLowerCase()}`
      })),
      ...saidas.map((saida: any) => ({
        id: saida.id,
        tipo: 'saida' as const,
        produto: saida.produto.nome,
        quantidade: saida.quantidade,
        data: saida.dataSaida,
        observacoes: saida.observacoes || `${saida.tipo.replace('_', ' ').toLowerCase()}`
      }))
    ]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: movimentacoes
    });
  } catch (error) {
    console.error('Erro ao buscar movimentações recentes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
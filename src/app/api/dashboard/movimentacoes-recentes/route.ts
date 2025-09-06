/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

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
    const limit = parseInt(searchParams.get('limit') || '10');

    // Buscar entradas recentes
    const entradas = await prisma.entrada.findMany({
      where: {
        companyId,
      },
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
      where: {
        companyId,
      },
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
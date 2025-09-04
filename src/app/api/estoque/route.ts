import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

// GET - Consultar estoque atual com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const produtoId = searchParams.get('produtoId');
    const categoria = searchParams.get('categoria');
    const search = searchParams.get('search');
    const estoqueMinimo = searchParams.get('estoqueMinimo');
    const estoqueMaximo = searchParams.get('estoqueMaximo');
    const valorMinimo = searchParams.get('valorMinimo');
    const valorMaximo = searchParams.get('valorMaximo');
    const somenteComEstoque = searchParams.get('somenteComEstoque') === 'true';
    const somenteEstoqueBaixo = searchParams.get('somenteEstoqueBaixo') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Construir filtros para produtos
    const produtoWhere: any = {
      ativo: true,
    };
    
    if (categoria) {
      produtoWhere.categoria = {
        contains: categoria,
        mode: 'insensitive',
      };
    }
    
    if (search) {
      produtoWhere.OR = [
        {
          nome: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          categoria: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          codigoBarras: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }
    
    // Construir filtros para estoque
    const estoqueWhere: any = {};
    
    if (produtoId) {
      estoqueWhere.produtoId = produtoId;
    }
    
    if (estoqueMinimo !== null && estoqueMinimo !== undefined) {
      estoqueWhere.quantidade = {
        ...estoqueWhere.quantidade,
        gte: parseFloat(estoqueMinimo),
      };
    }
    
    if (estoqueMaximo !== null && estoqueMaximo !== undefined) {
      estoqueWhere.quantidade = {
        ...estoqueWhere.quantidade,
        lte: parseFloat(estoqueMaximo),
      };
    }
    
    if (valorMinimo !== null && valorMinimo !== undefined) {
      estoqueWhere.valorMedio = {
        ...estoqueWhere.valorMedio,
        gte: parseFloat(valorMinimo),
      };
    }
    
    if (valorMaximo !== null && valorMaximo !== undefined) {
      estoqueWhere.valorMedio = {
        ...estoqueWhere.valorMedio,
        lte: parseFloat(valorMaximo),
      };
    }
    
    if (somenteComEstoque) {
      estoqueWhere.quantidade = {
        ...estoqueWhere.quantidade,
        gt: 0,
      };
    }
    
    if (somenteEstoqueBaixo) {
      // Filtrar produtos com estoque abaixo do mínimo
      const produtosComEstoqueBaixo = await prisma.estoque.findMany({
        where: {
          ...estoqueWhere,
        },
        include: {
          produto: true,
        },
      });
      
      const produtosFiltrados = produtosComEstoqueBaixo.filter(
        (estoque: any) => 
          estoque.quantidade < (estoque.produto.quantidadeMinima || 0)
      );
      
      const produtoIds = produtosFiltrados.map((estoque: any) => estoque.produtoId);
      
      if (produtoIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          resumo: {
            totalProdutos: 0,
            totalItensEstoque: 0,
            valorTotalEstoque: 0,
            produtosSemEstoque: 0,
            produtosEstoqueBaixo: 0,
          },
        });
      }
      
      estoqueWhere.produtoId = {
        in: produtoIds,
      };
    }
    
    // Buscar estoque com paginação
    const [estoques, total] = await Promise.all([
      prisma.estoque.findMany({
        where: estoqueWhere,
        include: {
          produto: {
            include: {
              _count: {
                select: {
                  entradas: true,
                  saidas: true,
                },
              },
            },
          },
        },
        orderBy: [
          {
            quantidade: 'asc',
          },
          {
            produto: {
              nome: 'asc',
            },
          },
        ],
        skip,
        take: limit,
      }),
      prisma.estoque.count({
        where: estoqueWhere,
      }),
    ]);
    
    // Filtrar estoques que têm produtos válidos
    const estoquesValidos = estoques.filter((estoque: any) => estoque.produto !== null);
    
    // Calcular resumo do estoque
    const resumoEstoque = await prisma.estoque.aggregate({
      where: estoqueWhere,
      _sum: {
        quantidade: true,
      },
      _count: {
        id: true,
      },
    });
    
    // Calcular valor total do estoque
    const valorTotalEstoque = estoquesValidos.reduce(
      (total: number, estoque: any) => total + (estoque.quantidade * (estoque.valorMedio || 0)),
      0
    );
    
    // Contar produtos sem estoque
    const produtosSemEstoque = await prisma.estoque.count({
      where: {
        quantidade: 0,
      },
    });
    
    // Contar produtos com estoque baixo
    const todosEstoques = await prisma.estoque.findMany({
      include: {
        produto: true,
      },
    });
    
    const produtosEstoqueBaixo = todosEstoques.filter(
      (estoque: any) => estoque.quantidade < (estoque.quantidadeMinima || 0)
    ).length;
    
    // Enriquecer dados com informações calculadas
    const estoquesEnriquecidos = estoquesValidos.map((estoque: any) => ({
      ...estoque,
      valorTotalItem: estoque.quantidade * (estoque.valorMedio || 0),
      statusEstoque: estoque.quantidade === 0 
        ? 'SEM_ESTOQUE' 
        : estoque.quantidade < (estoque.quantidadeMinima || 0)
        ? 'ESTOQUE_BAIXO'
        : 'ESTOQUE_OK',
      diasUltimaMovimentacao: estoque.ultimaAtualizacao 
        ? Math.floor((new Date().getTime() - estoque.ultimaAtualizacao.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));
    
    return NextResponse.json({
      success: true,
      data: estoquesEnriquecidos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      resumo: {
        totalProdutos: resumoEstoque._count.id || 0,
        totalItensEstoque: resumoEstoque._sum.quantidade || 0,
        valorTotalEstoque: Math.round(valorTotalEstoque * 100) / 100,
        produtosSemEstoque,
        produtosEstoqueBaixo,
      },
    });
  } catch (error) {
    console.error('Erro ao consultar estoque:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// POST - Ajustar estoque manualmente (inventário)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produtoId, quantidadeAjuste, motivo, observacoes } = body;
    
    if (!produtoId || quantidadeAjuste === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Produto ID e quantidade de ajuste são obrigatórios',
        },
        { status: 400 }
      );
    }
    
    // Verificar se o produto existe
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
    });
    
    if (!produto) {
      return NextResponse.json(
        {
          success: false,
          error: 'Produto não encontrado',
        },
        { status: 404 }
      );
    }
    
    // Buscar estoque atual
    let estoque = await prisma.estoque.findUnique({
      where: { produtoId },
    });
    
    const quantidadeAnterior = estoque?.quantidade || 0;
    const novaQuantidade = Math.max(0, quantidadeAnterior + quantidadeAjuste);
    
    // Usar transação para garantir consistência
    const resultado = await prisma.$transaction(async (tx: any) => {
      // Atualizar ou criar estoque
      let estoqueAtualizado;
      if (estoque) {
        estoqueAtualizado = await tx.estoque.update({
          where: { produtoId },
          data: {
            quantidade: novaQuantidade,
            ultimaAtualizacao: new Date(),
          },
          include: {
            produto: true,
          },
        });
      } else {
        estoqueAtualizado = await tx.estoque.create({
          data: {
            produtoId,
            quantidade: novaQuantidade,
            valorMedio: 0,
          },
          include: {
            produto: true,
          },
        });
      }
      
      // Registrar ajuste como entrada ou saída dependendo do tipo
      if (quantidadeAjuste > 0) {
        await tx.entrada.create({
          data: {
            tipo: 'TRANSFERENCIA_POSITIVA',
            quantidade: quantidadeAjuste,
            valorUnitario: estoqueAtualizado.valorMedio || 0,
            valorTotal: (estoqueAtualizado.valorMedio || 0) * quantidadeAjuste,
            observacoes: `Ajuste de inventário: ${motivo || 'Não informado'}. ${observacoes || ''}`,
            produtoId,
            fornecedorId: null,
          },
        });
      } else if (quantidadeAjuste < 0) {
        await tx.saida.create({
          data: {
            tipo: 'TRANSFERENCIA_NEGATIVA',
            quantidade: Math.abs(quantidadeAjuste),
            valorUnitario: estoqueAtualizado.valorMedio || 0,
            valorTotal: (estoqueAtualizado.valorMedio || 0) * Math.abs(quantidadeAjuste),
            observacoes: `Ajuste de inventário: ${motivo || 'Não informado'}. ${observacoes || ''}`,
            produtoId,
            talhaoId: null,
          },
        });
      }
      
      return estoqueAtualizado;
    });
    
    return NextResponse.json(
      {
        success: true,
        data: {
          ...resultado,
          quantidadeAnterior,
          quantidadeAjuste,
          novaQuantidade,
        },
        message: 'Estoque ajustado com sucesso',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao ajustar estoque:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
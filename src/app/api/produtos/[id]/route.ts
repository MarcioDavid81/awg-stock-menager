import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema de validação para atualização de produto
const updateProdutoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  descricao: z.string().optional(),
  unidade: z.string().min(1, 'Unidade é obrigatória').optional(),
  categoria: z.string().optional(),
  codigoBarras: z.string().optional(),
  ativo: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: {
        estoques: true,
        entradas: {
          include: {
            fornecedor: true,
          },
          orderBy: {
            dataEntrada: 'desc',
          },
          take: 10, // Últimas 10 entradas
        },
        saidas: {
          include: {
            talhao: true,
          },
          orderBy: {
            dataSaida: 'desc',
          },
          take: 10, // Últimas 10 saídas
        },
        _count: {
          select: {
            entradas: true,
            saidas: true,
          },
        },
      },
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
    
    return NextResponse.json({
      success: true,
      data: produto,
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = updateProdutoSchema.parse(body);
    
    // Verificar se o produto existe
    const existingProduto = await prisma.produto.findUnique({
      where: { id },
    });
    
    if (!existingProduto) {
      return NextResponse.json(
        {
          success: false,
          error: 'Produto não encontrado',
        },
        { status: 404 }
      );
    }
    
    // Verificar se já existe produto com mesmo código de barras (se fornecido)
    if (validatedData.codigoBarras && validatedData.codigoBarras !== existingProduto.codigoBarras) {
      const produtoComMesmoCodigo = await prisma.produto.findUnique({
        where: { codigoBarras: validatedData.codigoBarras },
      });
      
      if (produtoComMesmoCodigo) {
        return NextResponse.json(
          {
            success: false,
            error: 'Já existe um produto com este código de barras',
          },
          { status: 400 }
        );
      }
    }
    
    // Atualizar produto
    const produto = await prisma.produto.update({
      where: { id },
      data: validatedData,
      include: {
        estoques: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: produto,
      message: 'Produto atualizado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error,
        },
        { status: 400 }
      );
    }
    
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// DELETE - Excluir produto (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // Verificar se o produto existe
    const existingProduto = await prisma.produto.findUnique({
      where: { id },
      include: {
        entradas: true,
        saidas: true,
        estoques: true,
      },
    });
    
    if (!existingProduto) {
      return NextResponse.json(
        {
          success: false,
          error: 'Produto não encontrado',
        },
        { status: 404 }
      );
    }
    
    // Verificar se há movimentações associadas
    const temMovimentacoes = existingProduto.entradas.length > 0 || existingProduto.saidas.length > 0;
    
    if (temMovimentacoes) {
      // Se há movimentações, fazer soft delete
      const produto = await prisma.produto.update({
        where: { id },
        data: { ativo: false },
      });
      
      return NextResponse.json({
        success: true,
        data: produto,
        message: 'Produto desativado com sucesso (possui movimentações)',
      });
    } else {
      // Se não há movimentações, pode excluir completamente
      await prisma.estoque.deleteMany({
        where: { produtoId: id },
      });
      
      await prisma.produto.delete({
        where: { id },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Produto excluído com sucesso',
      });
    }
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
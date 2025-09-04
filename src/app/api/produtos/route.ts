import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema de validação para criação de produto
const createProdutoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  categoria: z.string().optional(),
  codigoBarras: z.string().optional(),
  ativo: z.boolean().default(true),
});

// Schema de validação para atualização de produto
const updateProdutoSchema = createProdutoSchema.partial();

// GET - Listar todos os produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');
    const categoria = searchParams.get('categoria');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const where: any = {};
    
    if (ativo !== null) {
      where.ativo = ativo === 'true';
    }
    
    if (categoria) {
      where.categoria = categoria;
    }
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { codigoBarras: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Contar total de registros
    const total = await prisma.produto.count({ where });
    
    // Buscar produtos com paginação
    const produtos = await prisma.produto.findMany({
      where,
      include: {
        estoques: true,
        _count: {
          select: {
            entradas: true,
            saidas: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      success: true,
      data: produtos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// POST - Criar novo produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = createProdutoSchema.parse(body);
    
    // Verificar se já existe produto com mesmo código de barras
    if (validatedData.codigoBarras) {
      const existingProduto = await prisma.produto.findUnique({
        where: { codigoBarras: validatedData.codigoBarras },
      });
      
      if (existingProduto) {
        return NextResponse.json(
          {
            success: false,
            error: 'Já existe um produto com este código de barras',
          },
          { status: 400 }
        );
      }
    }
    
    // Criar produto
    const produto = await prisma.produto.create({
      data: validatedData,
      include: {
        estoques: true,
      },
    });
    
    // Criar registro de estoque inicial
    await prisma.estoque.create({
      data: {
        produtoId: produto.id,
        quantidade: 0,
      },
    });
    
    return NextResponse.json(
      {
        success: true,
        data: produto,
        message: 'Produto criado com sucesso',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.issues,
        },
        { status: 400 }
      );
    }
    
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
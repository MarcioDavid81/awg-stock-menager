/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { z } from 'zod';
import { verifyToken } from '../../../../lib/auth';

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

// POST - Criar novo produto
export async function POST(request: NextRequest) {
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
    const body = await request.json();    
    // Validar dados de entrada
    const validatedData = createProdutoSchema.parse(body);    
    // Criar produto
    const produto = await prisma.produto.create({
      data: {
        ...validatedData,
        userId: userId,
        companyId: companyId,
      },
      include: {
        estoques: true,
      },
    });
    
    // Criar registro de estoque inicial
    await prisma.estoque.create({
      data: {
        produtoId: produto.id,
        quantidade: 0,
        companyId: companyId,
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

// GET - Listar todos os produtos
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
    const ativo = searchParams.get('ativo');
    const categoria = searchParams.get('categoria');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const where: any = {};
    where.companyId = companyId;
    
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
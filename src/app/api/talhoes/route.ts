/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { z } from 'zod';
import { authenticateRequest } from '../../../../lib/api-auth';

const prisma = new PrismaClient();

// Schema de validação para criação de talhão
const createTalhaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  area: z.number().positive('Área deve ser um número positivo').optional(),
  localizacao: z.string().optional(),
  ativo: z.boolean().default(true),
  farmId: z.string(),
});

// POST - Criar novo talhão
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authResult.response;
  }
  if (!authResult.payload) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  const { userId, companyId } = authResult.payload;
  try {
    const body = await request.json();    
    const validatedData = createTalhaoSchema.parse(body);    
    const existingTalhao = await prisma.talhao.findFirst({
      where: {
        nome: {
          equals: validatedData.nome,
          mode: 'insensitive',
        },
        companyId: companyId,
      },
    });
    
    if (existingTalhao) {
      return NextResponse.json(
        {
          success: false,
          error: 'Já existe um talhão com este nome',
        },
        { status: 400 }
      );
    }
    
    // Criar talhão
    const talhao = await prisma.talhao.create({
      data: {
        ...validatedData,
        companyId: companyId,
        userId: userId,
      },
    });
    
    return NextResponse.json(
      {
        success: true,
        data: talhao,
        message: 'Talhão criado com sucesso',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error,
          message: 'Dados inválidos',
        },
        { status: 400 }
      );
    }
    
    console.error('Erro ao criar talhão:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// GET - Listar todos os talhões
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authResult.response;
  }
  if (!authResult.payload) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  const { companyId } = authResult.payload;
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const where: any = {};
    where.companyId = companyId;
    
    if (ativo !== null) {
      where.ativo = ativo === 'true';
    }
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { localizacao: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Contar total de registros
    const total = await prisma.talhao.count({ where });
    
    // Buscar talhões com paginação
    const talhoes = await prisma.talhao.findMany({
      where,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            saidas: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
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
      data: talhoes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar talhões:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}


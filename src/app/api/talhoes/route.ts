/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { z } from 'zod';
import { verifyToken } from '../../../../lib/auth';

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


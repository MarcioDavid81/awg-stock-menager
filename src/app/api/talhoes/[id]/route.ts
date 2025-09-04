import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema de validação para atualização de talhão
const updateTalhaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  descricao: z.string().optional(),
  area: z.number().positive('Área deve ser um número positivo').optional(),
  localizacao: z.string().optional(),
  ativo: z.boolean().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Buscar talhão por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    const talhao = await prisma.talhao.findUnique({
      where: { id },
      include: {
        saidas: {
          include: {
            produto: true,
          },
          orderBy: {
            dataSaida: 'desc',
          },
          take: 20, // Últimas 20 aplicações
        },
        _count: {
          select: {
            saidas: true,
          },
        },
      },
    });
    
    if (!talhao) {
      return NextResponse.json(
        {
          success: false,
          error: 'Talhão não encontrado',
        },
        { status: 404 }
      );
    }
    
    // Calcular estatísticas do talhão
    const estatisticas = {
      totalAplicacoes: talhao._count.saidas,
      ultimaAplicacao: talhao.saidas[0]?.dataSaida || null,
      produtosMaisUsados: await prisma.saida.groupBy({
        by: ['produtoId'],
        where: {
          talhaoId: id,
        },
        _count: {
          produtoId: true,
        },
        _sum: {
          quantidade: true,
        },
        orderBy: {
          _count: {
            produtoId: 'desc',
          },
        },
        take: 5,
      }),
    };
    
    return NextResponse.json({
      success: true,
      data: {
        ...talhao,
        estatisticas,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar talhão:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar talhão
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = updateTalhaoSchema.parse(body);
    
    // Verificar se o talhão existe
    const existingTalhao = await prisma.talhao.findUnique({
      where: { id },
    });
    
    if (!existingTalhao) {
      return NextResponse.json(
        {
          success: false,
          error: 'Talhão não encontrado',
        },
        { status: 404 }
      );
    }
    
    // Verificar se já existe talhão com mesmo nome (se fornecido)
    if (validatedData.nome && validatedData.nome !== existingTalhao.nome) {
      const talhaoComMesmoNome = await prisma.talhao.findFirst({
        where: {
          nome: {
            equals: validatedData.nome,
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      });
      
      if (talhaoComMesmoNome) {
        return NextResponse.json(
          {
            success: false,
            error: 'Já existe um talhão com este nome',
          },
          { status: 400 }
        );
      }
    }
    
    // Atualizar talhão
    const talhao = await prisma.talhao.update({
      where: { id },
      data: validatedData,
    });
    
    return NextResponse.json({
      success: true,
      data: talhao,
      message: 'Talhão atualizado com sucesso',
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
    
    console.error('Erro ao atualizar talhão:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// DELETE - Excluir talhão (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // Verificar se o talhão existe
    const existingTalhao = await prisma.talhao.findUnique({
      where: { id },
      include: {
        saidas: true,
      },
    });
    
    if (!existingTalhao) {
      return NextResponse.json(
        {
          success: false,
          error: 'Talhão não encontrado',
        },
        { status: 404 }
      );
    }
    
    // Verificar se há aplicações associadas
    const temAplicacoes = existingTalhao.saidas.length > 0;
    
    if (temAplicacoes) {
      // Se há aplicações, fazer soft delete
      const talhao = await prisma.talhao.update({
        where: { id },
        data: { ativo: false },
      });
      
      return NextResponse.json({
        success: true,
        data: talhao,
        message: 'Talhão desativado com sucesso (possui aplicações registradas)',
      });
    } else {
      // Se não há aplicações, pode excluir completamente
      await prisma.talhao.delete({
        where: { id },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Talhão excluído com sucesso',
      });
    }
  } catch (error) {
    console.error('Erro ao excluir talhão:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
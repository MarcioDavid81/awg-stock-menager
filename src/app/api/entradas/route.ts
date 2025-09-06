/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { z } from 'zod';
import { verifyToken } from '../../../../lib/auth';

const prisma = new PrismaClient();

// Schema de validação para criação de entrada
const createEntradaSchema = z.object({
  tipo: z.enum(['COMPRA', 'TRANSFERENCIA_POSITIVA'], {
    message: 'Tipo deve ser COMPRA ou TRANSFERENCIA_POSITIVA',
  }),
  quantidade: z.number().positive('Quantidade deve ser um número positivo'),
  valorUnitario: z.number().positive('Valor unitário deve ser um número positivo').optional(),
  valorTotal: z.number().positive('Valor total deve ser um número positivo').optional(),
  numeroNota: z.string().optional(),
  observacoes: z.string().optional(),
  dataEntrada: z.string().optional(),
  produtoId: z.string().min(1, 'Produto é obrigatório'),
  fornecedorId: z.string().optional(),
}).refine((data) => {
  // Se é uma compra, fornecedor é obrigatório
  if (data.tipo === 'COMPRA' && !data.fornecedorId) {
    return false;
  }
  return true;
}, {
  message: 'Fornecedor é obrigatório para compras',
  path: ['fornecedorId'],
}).refine((data) => {
  // Se valor unitário for fornecido, calcular valor total automaticamente
  if (data.valorUnitario && !data.valorTotal) {
    data.valorTotal = data.valorUnitario * data.quantidade;
  }
  return true;
});



// Função para atualizar estoque após entrada
async function atualizarEstoque(produtoId: string, companyId: string, quantidade: number, valorUnitario?: number) {
  const estoque = await prisma.estoque.findUnique({
    where: { produtoId, companyId },
  });
  
  if (!estoque) {
    // Criar estoque se não existir
    await prisma.estoque.create({
      data: {
        produtoId,
        companyId,
        quantidade,
        valorMedio: valorUnitario || 0,
      },
    });
  } else {
    // Calcular novo valor médio ponderado
    let novoValorMedio = estoque.valorMedio || 0;
    
    if (valorUnitario && valorUnitario > 0) {
      const valorTotalAnterior = (estoque.valorMedio || 0) * estoque.quantidade;
      const valorTotalNovo = valorUnitario * quantidade;
      const quantidadeTotal = estoque.quantidade + quantidade;
      
      novoValorMedio = quantidadeTotal > 0 ? (valorTotalAnterior + valorTotalNovo) / quantidadeTotal : 0;
    }
    
    // Atualizar estoque
    await prisma.estoque.update({
      where: { produtoId },
      data: {
        quantidade: estoque.quantidade + quantidade,
        valorMedio: novoValorMedio,
        ultimaAtualizacao: new Date(),
      },
    });
  }
}


// POST - Criar nova entrada
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
  const { companyId, userId } = payload;
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = createEntradaSchema.parse(body);
    
    // Verificar se o produto existe
    const produto = await prisma.produto.findUnique({
      where: { 
        id: validatedData.produtoId,
        companyId,
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
    
    // Verificar se o fornecedor existe (se fornecido)
    if (validatedData.fornecedorId) {
      const fornecedor = await prisma.fornecedor.findUnique({
        where: { 
          id: validatedData.fornecedorId,
          companyId,
         },
      });
      
      if (!fornecedor) {
        return NextResponse.json(
          {
            success: false,
            error: 'Fornecedor não encontrado',
          },
          { status: 404 }
        );
      }
    }
    
    // Calcular valor total se não fornecido
    if (validatedData.valorUnitario && !validatedData.valorTotal) {
      validatedData.valorTotal = validatedData.valorUnitario * validatedData.quantidade;
    }
    
    // Usar transação para garantir consistência
    const resultado = await prisma.$transaction(async (tx: any) => {
      // Criar entrada
      const entrada = await tx.entrada.create({
        data: {
          ...validatedData,
          companyId,
          userId,
          dataEntrada: validatedData.dataEntrada ? new Date(validatedData.dataEntrada) : new Date(),
        },
        include: {
          produto: true,
          fornecedor: true,
        },
      });
      
      // Atualizar estoque
      await atualizarEstoque(
        validatedData.produtoId,
        companyId,
        validatedData.quantidade,
        validatedData.valorUnitario
      );
      
      return entrada;
    });
    
    return NextResponse.json(
      {
        success: true,
        data: resultado,
        message: 'Entrada registrada com sucesso',
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
    
    console.error('Erro ao criar entrada:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// GET - Listar todas as entradas
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
    const tipo = searchParams.get('tipo');
    const produtoId = searchParams.get('produtoId');
    const fornecedorId = searchParams.get('fornecedorId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const where: any = {};
    where.companyId = companyId;
    
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (produtoId) {
      where.produtoId = produtoId;
    }
    
    if (fornecedorId) {
      where.fornecedorId = fornecedorId;
    }
    
    if (dataInicio || dataFim) {
      where.dataEntrada = {};
      if (dataInicio) {
        where.dataEntrada.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataEntrada.lte = new Date(dataFim);
      }
    }
    
    const skip = (page - 1) * limit;
    
    const [entradas, total] = await Promise.all([
      prisma.entrada.findMany({
        where,
        include: {
          produto: true,
          fornecedor: true,
        },
        orderBy: {
          dataEntrada: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.entrada.count({ where }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: entradas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar entradas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}


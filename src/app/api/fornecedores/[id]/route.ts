import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

// Função para validar CPF
function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.charAt(10));
}

// Função para validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

// Schema de validação para atualização de fornecedor
const updateFornecedorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  cnpj: z.string().optional().refine((val) => {
    if (!val) return true;
    return validarCNPJ(val);
  }, 'CNPJ inválido'),
  cpf: z.string().optional().refine((val) => {
    if (!val) return true;
    return validarCPF(val);
  }, 'CPF inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  ativo: z.boolean().optional(),
}).refine((data) => {
  if (data.cnpj && data.cpf) {
    return false;
  }
  return true;
}, {
  message: 'Informe apenas CPF ou CNPJ, não ambos',
  path: ['cnpj'],
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Buscar fornecedor por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id },
      include: {
        entradas: {
          include: {
            produto: true,
          },
          orderBy: {
            dataEntrada: 'desc',
          },
          take: 20, // Últimas 20 compras
        },
        _count: {
          select: {
            entradas: true,
          },
        },
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
    
    // Calcular estatísticas do fornecedor
    const estatisticas = {
      totalCompras: fornecedor._count.entradas,
      ultimaCompra: fornecedor.entradas[0]?.dataEntrada || null,
      valorTotalCompras: fornecedor.entradas.reduce((total: number, entrada: any) => {
        return total + (entrada.valorTotal || 0);
      }, 0),
      produtosMaisComprados: await prisma.entrada.groupBy({
        by: ['produtoId'],
        where: {
          fornecedorId: id,
        },
        _count: {
          produtoId: true,
        },
        _sum: {
          quantidade: true,
          valorTotal: true,
        },
        orderBy: {
          _sum: {
            valorTotal: 'desc',
          },
        },
        take: 5,
      }),
    };
    
    return NextResponse.json({
      success: true,
      data: {
        ...fornecedor,
        estatisticas,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar fornecedor
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = updateFornecedorSchema.parse(body);
    
    // Verificar se o fornecedor existe
    const existingFornecedor = await prisma.fornecedor.findUnique({
      where: { id },
    });
    
    if (!existingFornecedor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fornecedor não encontrado',
        },
        { status: 404 }
      );
    }
    
    // Verificar se já existe fornecedor com mesmo CNPJ ou CPF (se fornecidos)
    const whereConditions = [];
    
    if (validatedData.cnpj && validatedData.cnpj !== existingFornecedor.cnpj) {
      whereConditions.push({ cnpj: validatedData.cnpj });
    }
    
    if (validatedData.cpf && validatedData.cpf !== existingFornecedor.cpf) {
      whereConditions.push({ cpf: validatedData.cpf });
    }
    
    if (whereConditions.length > 0) {
      const fornecedorComMesmoDocumento = await prisma.fornecedor.findFirst({
        where: {
          OR: whereConditions,
          id: {
            not: id,
          },
        },
      });
      
      if (fornecedorComMesmoDocumento) {
        const documento = fornecedorComMesmoDocumento.cnpj ? 'CNPJ' : 'CPF';
        return NextResponse.json(
          {
            success: false,
            error: `Já existe um fornecedor com este ${documento}`,
          },
          { status: 400 }
        );
      }
    }
    
    // Atualizar fornecedor
    const fornecedor = await prisma.fornecedor.update({
      where: { id },
      data: validatedData,
    });
    
    return NextResponse.json({
      success: true,
      data: fornecedor,
      message: 'Fornecedor atualizado com sucesso',
    });
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
    
    console.error('Erro ao atualizar fornecedor:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// DELETE - Excluir fornecedor (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Verificar se o fornecedor existe
    const existingFornecedor = await prisma.fornecedor.findUnique({
      where: { id },
      include: {
        entradas: true,
      },
    });
    
    if (!existingFornecedor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fornecedor não encontrado',
        },
        { status: 404 }
      );
    }
    
    // Verificar se há compras associadas
    const temCompras = existingFornecedor.entradas.length > 0;
    
    if (temCompras) {
      // Se há compras, fazer soft delete
      const fornecedor = await prisma.fornecedor.update({
        where: { id },
        data: { ativo: false },
      });
      
      return NextResponse.json({
        success: true,
        data: fornecedor,
        message: 'Fornecedor desativado com sucesso (possui compras registradas)',
      });
    } else {
      // Se não há compras, pode excluir completamente
      await prisma.fornecedor.delete({
        where: { id },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Fornecedor excluído com sucesso',
      });
    }
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
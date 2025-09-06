/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";
import { z } from "zod";
import { validarCNPJ, validarCPF } from "@/lib/utils";
import { verifyToken } from "../../../../../lib/auth";

const prisma = new PrismaClient();

// Schema de validação para atualização de fornecedor
const updateFornecedorSchema = z
  .object({
    nome: z.string().min(1, "Nome é obrigatório").optional(),
    cnpj: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        return validarCNPJ(val);
      }, "CNPJ inválido"),
    cpf: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        return validarCPF(val);
      }, "CPF inválido"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    telefone: z.string().optional(),
    endereco: z.string().optional(),
    ativo: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.cnpj && data.cpf) {
        return false;
      }
      return true;
    },
    {
      message: "Informe apenas CPF ou CNPJ, não ambos",
      path: ["cnpj"],
    }
  );

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Buscar fornecedor por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID do fornecedor não fornecido" },
      { status: 400 }
    );
  }
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
    const fornecedor = await prisma.fornecedor.findUnique({
      where: {
        id: id,
        companyId: companyId,
      },
      include: {
        entradas: {
          include: {
            produto: true,
          },
          orderBy: {
            dataEntrada: "desc",
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
          error: "Fornecedor não encontrado",
        },
        { status: 404 }
      );
    }

    // Calcular estatísticas do fornecedor
    const estatisticas = {
      totalCompras: fornecedor._count.entradas,
      ultimaCompra: fornecedor.entradas[0]?.dataEntrada || null,
      valorTotalCompras: fornecedor.entradas.reduce(
        (total: number, entrada: any) => {
          return total + (entrada.valorTotal || 0);
        },
        0
      ),
      produtosMaisComprados: await prisma.entrada.groupBy({
        by: ["produtoId"],
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
            valorTotal: "desc",
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
    console.error("Erro ao buscar fornecedor:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar fornecedor
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID do fornecedor não fornecido" },
      { status: 400 }
    );
  }
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
  const body = await request.json();
  const validatedData = updateFornecedorSchema.parse(body);
  try {
    // Verificar se o fornecedor existe
    const existingFornecedor = await prisma.fornecedor.findUnique({
      where: { 
        id: id,
        userId: userId,
        companyId: companyId,
       },
    });

    if (!existingFornecedor) {
      return NextResponse.json(
        {
          success: false,
          error: "Fornecedor não encontrado",
        },
        { status: 404 }
      );
    }

    // Verificar se já existe um fornecedor com o mesmo CNPJ ou CPF na empresa
    const documentConditions = [];

    if (validatedData.cnpj && validatedData.cnpj !== existingFornecedor.cnpj) {
      documentConditions.push({ cnpj: validatedData.cnpj });
    }

    if (validatedData.cpf && validatedData.cpf !== existingFornecedor.cpf) {
      documentConditions.push({ cpf: validatedData.cpf });
    }

    if (documentConditions.length > 0) {
      const existingFornecedorWithSameDoc = await prisma.fornecedor.findFirst({
        where: {
          companyId: companyId,
          OR: documentConditions,
          id: { not: id },
        },
      });

      if (existingFornecedorWithSameDoc) {
        return NextResponse.json(
          { error: "Já existe nesta empresa um fornecedor com este CNPJ" },
          { status: 400 }
        );
      }
    }

    // Atualizar fornecedor
    const fornecedor = await prisma.fornecedor.update({
      where: {
        id: id,
        companyId: companyId,
       },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: fornecedor,
      message: "Fornecedor atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar fornecedor:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// DELETE - Excluir fornecedor (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID do fornecedor não fornecido" },
      { status: 400 }
    );
  }
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
    // Verificar se o fornecedor existe
    const existingFornecedor = await prisma.fornecedor.findUnique({
      where: { 
        id: id,
        userId: userId,
        companyId: companyId,
       },
      include: {
        entradas: true,
      },
    });

    if (!existingFornecedor) {
      return NextResponse.json(
        {
          success: false,
          error: "Fornecedor não encontrado ou não pertence ao usuário e à empresa",
        },
        { status: 404 }
      );
    }

    // Verificar se há compras associadas
    const temCompras = existingFornecedor.entradas.length > 0;

    if (temCompras) {
      // Se há compras, fazer soft delete
      const fornecedor = await prisma.fornecedor.update({
        where: { 
          id: id,
          userId: userId,
          companyId: companyId,
         },
        data: { ativo: false },
      });

      return NextResponse.json({
        success: true,
        data: fornecedor,
        message:
          "Fornecedor desativado com sucesso (possui compras registradas)",
      });
    } else {
      // Se não há compras, pode excluir completamente
      await prisma.fornecedor.delete({
        where: { 
          id: id,
          userId: userId,
          companyId: companyId,
         },
      });

      return NextResponse.json({
        success: true,
        message: "Fornecedor excluído com sucesso",
      });
    }
  } catch (error) {
    console.error("Erro ao excluir fornecedor:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

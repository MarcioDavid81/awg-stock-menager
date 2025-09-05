import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";
import { z } from "zod";
import { hash } from "bcrypt";
import { uploadAvatarToCloudinary } from "../../../../../lib/cloudinary/upload-avatar";

const prisma = new PrismaClient();

const createUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").refine((value) => {
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  }, "A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial"),
  avatarUrl: z.instanceof(File).optional().nullable(),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  companyId: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await prisma.user.findFirst({
      where: {
        id: id,
      }
    });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não encontrado",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar usuário",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = createUserSchema.parse(body);
    const existUser = await prisma.user.findFirst({
      where: {
        id: id,
      }
    });
    if (!existUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não encontrado",
        },
        { status: 404 }
      );
    }
    const hashedPassword = await hash(validatedData.password, 10);
    validatedData.password = hashedPassword;
    const avatarImageUrl = await uploadAvatarToCloudinary(
      validatedData.avatarUrl
    );
    const userData = {
      ...validatedData,
      avatarUrl: avatarImageUrl,
      password: hashedPassword,
    };
    const user = await prisma.user.update({
      where: {
        id: id,
      },
      data: userData,
    });
    return NextResponse.json(
      {
        success: true,
        data: user,
        message: "Usuário atualizado com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: error,
        },
        { status: 400 }
      );
    }
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao atualizar usuário",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await prisma.user.findFirst({
      where: {
        id: id,
      }
    });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não encontrado",
        },
        { status: 404 }
      );
    }
    await prisma.user.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json(
      {
        success: true,
        message: "Usuário deletado com sucesso",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao deletar usuário",
      },
      { status: 500 }
    );
  }
}
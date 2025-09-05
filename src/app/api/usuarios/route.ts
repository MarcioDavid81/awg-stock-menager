import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../generated/prisma";
import { z } from "zod";
import { hash } from "bcrypt";
import { uploadAvatarToCloudinary } from "../../../../lib/cloudinary/upload-avatar";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createUserSchema.parse(body);
    const existUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validatedData.email }],
      },
    });
    if (existUser) {
      return NextResponse.json({
        success: false,
        error: "Usuário já cadastrado",
      });
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
    const user = await prisma.user.create({
      data: userData,
    });
    return NextResponse.json(
      {
        success: true,
        data: user,
        message: "Usuário criado com sucesso",
      },
      { status: 201 }
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
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao criar usuário",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: search,
        },
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        company: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return NextResponse.json({
      success: true,
      data: users,
      message: "Usuários buscados com sucesso",
      total: users.length,
      totalPages: Math.ceil(users.length / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar usuários",
      },
      { status: 500 }
    );
  }
}

import { validarCNPJ, validarCPF } from '@/lib/utils';
import { z } from 'zod';

// Tipos base dos modelos
export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  users: User[];
  farms: Farm[];
  talhoes: Talhao[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
  entradas: Entrada[];
  saidas: Saida[];
  estoques: Estoque[];
  createdAt: Date;
  updatedAt: Date;
}
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'USER';
  companyId?: string;
  company?: Company;
  farms: Farm[];
  talhoes: Talhao[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
  entradas: Entrada[];
  saidas: Saida[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Farm {
  id: string;
  name: string;
  area: number;
  userId: string;
  user?: User;
  companyId?: string;
  company?: Company;
  talhaos: Talhao[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Talhao {
  id: string;
  nome: string;
  descricao?: string;
  area: number;
  localizacao?: string;
  ativo: boolean;
  farmId?: string;
  farm?: Farm;
  userId?: string;
  user?: User;
  companyId?: string;
  company?: Company;
  createdAt: Date;
  updatedAt: Date;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  userId?: string;
  user?: User;
  companyId?: string;
  company?: Company;
  createdAt: Date;
  updatedAt: Date;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  entradas: Entrada[];
  saidas: Saida[];
  descricao?: string;
  createdAt: Date;
  updatedAt: Date;
  fornecedorId?: string;
  fornecedor?: Fornecedor;
  userId?: string;
  user?: User;
  companyId?: string;
  company?: Company;
}

export interface Entrada {
  id: string;
  tipo: 'COMPRA' | 'TRANSFERENCIA_POSITIVA';
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  numeroNota?: string;
  observacoes?: string;
  dataEntrada: Date;
  createdAt: Date;
  updatedAt: Date;
  produtoId: string;
  produto?: Produto;
  fornecedorId?: string;
  fornecedor?: Fornecedor;
  userId?: string;
  user?: User;
  companyId?: string;
  company?: Company;
}

export interface Saida {
  id: string;
  tipo: 'APLICACAO' | 'TRANSFERENCIA_NEGATIVA';
  quantidade: number;
  observacoes?: string;
  dataSaida: Date;
  createdAt: Date;
  updatedAt: Date;
  produtoId: string;
  produto?: Produto;
  talhaoId?: string;
  talhao?: Talhao;
  userId?: string;
  user?: User;
  companyId?: string;
  company?: Company;
}

export interface Estoque {
  id: string;
  quantidade: number;
  quantidadeMinima: number;
  valorMedio: number;
  ultimaAtualizacao: Date;
  createdAt: Date;
  updatedAt: Date;
  produtoId: string;
  produto?: Produto;
  companyId?: string;
  company?: Company;
}

// Schemas Zod para validação de formulários
export const companySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().optional(),
  cpf: z.string().optional(),
  email: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
});

export const userSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").refine((value) => {
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  }, "A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial"),
  avatarUrl: z.instanceof(File).optional(),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
  companyId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export const farmSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  area: z.number().positive('Área deve ser um número positivo'),
});

export const talhaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  area: z.number().positive('Área deve ser um número positivo'),
  localizacao: z.string().optional(),
  ativo: z.boolean().optional(),
  observacoes: z.string().optional(),
  farmId: z.string().optional(),
  userId: z.string().optional(),
  companyId: z.string().optional(),
});

export const fornecedorSchema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  cnpj: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    return validarCNPJ(val);
  }, 'CNPJ invalido'),
  cpf: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    return validarCPF(val);
  }, 'CPF invalido'),
  telefone: z.string().optional(),
  email: z.string().optional(),
  endereco: z.string().optional(),
  userId: z.string().optional(),
  companyId: z.string().optional(),
}).refine((data) => {
  const hasCnpj = data.cnpj && data.cnpj.trim() !== '';
  const hasCpf = data.cpf && data.cpf.trim() !== '';
  return hasCnpj || hasCpf;
}, {
  message: 'E necessario informar CPF ou CNPJ',
  path: ['cnpj'],
}).refine((data) => {
  const hasCnpj = data.cnpj && data.cnpj.trim() !== '';
  const hasCpf = data.cpf && data.cpf.trim() !== '';
  return !(hasCnpj && hasCpf);
}, {
  message: 'Informe apenas CPF ou CNPJ, nao ambos',
  path: ['cnpj'],
});

export const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  observacoes: z.string().optional(),
  fornecedorId: z.string().optional(),
  userId: z.string().optional(),
  companyId: z.string().optional(),
});

export const entradaSchema = z.object({
  tipo: z.enum(['COMPRA', 'TRANSFERENCIA_POSITIVA']),
  quantidade: z.number().positive('Quantidade deve ser um número positivo'),
  valorUnitario: z.number().min(0, 'Valor unitário deve ser um número não negativo').optional(),
  valorTotal: z.number().min(0, 'Valor total deve ser um número não negativo').optional(),
  numeroNota: z.string().optional(),
  observacoes: z.string().optional(),
  dataEntrada: z.string().optional(),
  produtoId: z.string().min(1, 'Produto é obrigatório'),
  fornecedorId: z.string().optional(),
  userId: z.string().optional(),
  companyId: z.string().optional(),
}).refine((data) => {
  if (data.tipo === 'COMPRA' && !data.fornecedorId) {
    return false;
  }
  return true;
}, {
  message: 'Fornecedor é obrigatório para compras',
  path: ['fornecedorId'],
}).refine((data) => {
  if (data.tipo === 'COMPRA' && (!data.valorUnitario || data.valorUnitario <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'Valor unitário é obrigatório e deve ser positivo para compras',
  path: ['valorUnitario'],
});

export const saidaSchema = z.object({
  tipo: z.enum(['APLICACAO', 'TRANSFERENCIA_NEGATIVA']),
  quantidade: z.number().positive('Quantidade deve ser um número positivo'),
  observacoes: z.string().optional(),
  dataSaida: z.string().optional(),
  produtoId: z.string().min(1, 'Produto é obrigatório'),
  talhaoId: z.string().optional(),
  userId: z.string().optional(),
  companyId: z.string().optional(),
}).refine((data) => {
  if (data.tipo === 'APLICACAO' && !data.talhaoId) {
    return false;
  }
  return true;
}, {
  message: 'Talhão é obrigatório para aplicações',
  path: ['talhaoId'],
});

// Tipos para formulários
export type CompanyFormData = z.infer<typeof companySchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type FarmFormData = z.infer<typeof farmSchema>;
export type TalhaoFormData = z.infer<typeof talhaoSchema>;
export type FornecedorFormData = z.infer<typeof fornecedorSchema>;
export type ProdutoFormData = z.infer<typeof produtoSchema>;
export type EntradaFormData = z.infer<typeof entradaSchema>;
export type SaidaFormData = z.infer<typeof saidaSchema>;

// Tipos para respostas da API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para filtros
export interface CompanyFilters {
  name?: string;
  cnpj?: string;
  cpf?: string;
  userId?: string;
}

export interface UserFilters {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface FarmFilters {
  name?: string;
  area?: number;
  userId?: string;
}

export interface TalhaoFilters {
  nome?: string;
  area?: number;
}

export interface FornecedorFilters {
  nome?: string;
  cnpj?: string;
  cpf?: string;
}

export interface ProdutoFilters {
  nome?: string;
  categoria?: string;
  fornecedorId?: string;
}

export interface EntradaFilters {
  tipo?: 'COMPRA' | 'TRANSFERENCIA_POSITIVA';
  produtoId?: string;
  fornecedorId?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface SaidaFilters {
  tipo?: 'APLICACAO' | 'TRANSFERENCIA_NEGATIVA';
  produtoId?: string;
  talhaoId?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface EstoqueFilters {
  produtoId?: string;
  categoria?: string;
  estoqueMinimo?: boolean;
}

// Tipos para dashboard
export interface DashboardStats {
  totalProdutos: number;
  totalTalhoes: number;
  totalFornecedores: number;
  produtosEstoqueBaixo: number;
  entradasMes: number;
  saidasMes: number;
  valorTotalEstoque: number;
}

export interface EstoqueBaixo {
  produto: Produto;
  quantidadeAtual: number;
  quantidadeMinima: number;
  diferenca: number;
}

export interface MovimentacaoRecente {
  id: string;
  tipo: 'entrada' | 'saida';
  produto: string;
  quantidade: number;
  data: Date;
  observacoes?: string;
}
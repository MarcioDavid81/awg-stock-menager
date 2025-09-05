// Tipos para as entidades do sistema AWG Stock Manager

// Enums do Prisma
export enum TipoEntrada {
  COMPRA = 'COMPRA',
  TRANSFERENCIA_POSITIVA = 'TRANSFERENCIA_POSITIVA',
}

export enum TipoSaida {
  APLICACAO = 'APLICACAO',
  TRANSFERENCIA_NEGATIVA = 'TRANSFERENCIA_NEGATIVA',
}

export enum StatusEstoque {
  SEM_ESTOQUE = 'SEM_ESTOQUE',
  ESTOQUE_BAIXO = 'ESTOQUE_BAIXO',
  ESTOQUE_OK = 'ESTOQUE_OK',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// Interfaces base das entidades
export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  role: UserRole;
  companyId: string;
}

export interface Farm {
  id: string;
  name: string
  area: number;
  companyId: string;
  userId: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  codigoBarras?: string;
  descricao?: string;
  ativo: boolean;
  companyId: string;
  userId: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Talhao {
  id: string;
  nome: string;
  area?: number;
  localizacao?: string;
  observacoes?: string;
  ativo: boolean;
  companyId: string;
  userId: string;
  farmId: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;
  ativo: boolean;
  companyId: string;
  userId: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Entrada {
  id: string;
  tipo: TipoEntrada;
  quantidade: number;
  valorUnitario?: number;
  valorTotal?: number;
  numeroNota?: string;
  observacoes?: string;
  dataEntrada: Date;
  produtoId: string;
  fornecedorId?: string;
  companyId: string;
  userId: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Saida {
  id: string;
  tipo: TipoSaida;
  quantidade: number;
  valorUnitario?: number;
  valorTotal?: number;
  observacoes?: string;
  dataSaida: Date;
  produtoId: string;
  talhaoId?: string;
  criadoEm: Date;
  companyId: string;
  userId: string;
  atualizadoEm: Date;
}

export interface Estoque {
  id: string;
  quantidade: number;
  quantidadeMinima?: number;
  valorMedio?: number;
  ultimaAtualizacao: Date;
  produtoId: string;
  companyId: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

// Interfaces para requests (DTOs)
export interface CreateCompanyRequest {
  name: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  companyId: string;
  userId: string;
  ativo?: boolean;
}

export interface UpdateCompanyRequest {
  name?: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo?: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  role: UserRole;
  companyId: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  role?: UserRole;
  companyId?: string;
}

export interface CreateFarmRequest {
  name: string;
  area: number;
  companyId: string;
  userId: string;
}

export interface UpdateFarmRequest {
  name?: string;
  area?: number;
}

export interface CreateProdutoRequest {
  nome: string;
  categoria: string;
  unidadeMedida: string;
  codigoBarras?: string;
  descricao?: string;
  estoqueMinimo?: number;
}

export interface UpdateProdutoRequest {
  nome?: string;
  categoria?: string;
  unidadeMedida?: string;
  codigoBarras?: string;
  descricao?: string;
  estoqueMinimo?: number;
  ativo?: boolean;
}

export interface CreateTalhaoRequest {
  nome: string;
  area?: number;
  localizacao?: string;
  observacoes?: string;
}

export interface UpdateTalhaoRequest {
  nome?: string;
  area?: number;
  localizacao?: string;
  observacoes?: string;
  ativo?: boolean;
}

export interface CreateFornecedorRequest {
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;
}

export interface UpdateFornecedorRequest {
  nome?: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;
  ativo?: boolean;
}

export interface CreateEntradaRequest {
  tipo: TipoEntrada;
  quantidade: number;
  valorUnitario?: number;
  valorTotal?: number;
  numeroNota?: string;
  observacoes?: string;
  dataEntrada?: string;
  produtoId: string;
  fornecedorId?: string;
}

export interface UpdateEntradaRequest {
  tipo?: TipoEntrada;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal?: number;
  numeroNota?: string;
  observacoes?: string;
  dataEntrada?: string;
  produtoId?: string;
  fornecedorId?: string;
}

export interface CreateSaidaRequest {
  tipo: TipoSaida;
  quantidade: number;
  valorUnitario?: number;
  valorTotal?: number;
  observacoes?: string;
  dataSaida?: string;
  produtoId: string;
  talhaoId?: string;
}

export interface UpdateSaidaRequest {
  tipo?: TipoSaida;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal?: number;
  observacoes?: string;
  dataSaida?: string;
  produtoId?: string;
  talhaoId?: string;
}

export interface AjusteEstoqueRequest {
  produtoId: string;
  quantidadeAjuste: number;
  motivo?: string;
  observacoes?: string;
}

// Interfaces para responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EstoqueResponse extends Estoque {
  produto: Produto;
  valorTotalItem: number;
  statusEstoque: StatusEstoque;
  diasUltimaMovimentacao: number | null;
}

export interface EstoqueResumo {
  totalProdutos: number;
  totalItensEstoque: number;
  valorTotalEstoque: number;
  produtosSemEstoque: number;
  produtosEstoqueBaixo: number;
}

export interface EstoqueConsultaResponse extends PaginatedResponse<EstoqueResponse> {
  resumo: EstoqueResumo;
}

// Interfaces para entidades com relacionamentos
export interface ProdutoComEstoque extends Produto {
  estoques: Estoque[];
  _count: {
    entradas: number;
    saidas: number;
  };
}

export interface EntradaComRelacionamentos extends Entrada {
  produto: Produto;
  fornecedor?: Fornecedor;
}

export interface SaidaComRelacionamentos extends Saida {
  produto: Produto;
  talhao?: Talhao;
}

export interface TalhaoComEstatisticas extends Talhao {
  _count: {
    saidas: number;
  };
  totalAplicacoes?: number;
  ultimaAplicacao?: Date;
}

export interface FornecedorComEstatisticas extends Fornecedor {
  _count: {
    entradas: number;
  };
  totalCompras?: number;
  ultimaCompra?: Date;
}

// Tipos para filtros de consulta
export interface ProdutoFilters {
  ativo?: boolean;
  categoria?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TalhaoFilters {
  ativo?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FornecedorFilters {
  ativo?: boolean;
  search?: string;
  tipo?: 'CPF' | 'CNPJ';
  page?: number;
  limit?: number;
}

export interface EntradaFilters {
  tipo?: TipoEntrada;
  produtoId?: string;
  fornecedorId?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
}

export interface SaidaFilters {
  tipo?: TipoSaida;
  produtoId?: string;
  talhaoId?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
}

export interface EstoqueFilters {
  produtoId?: string;
  categoria?: string;
  search?: string;
  estoqueMinimo?: number;
  estoqueMaximo?: number;
  valorMinimo?: number;
  valorMaximo?: number;
  somenteComEstoque?: boolean;
  somenteEstoqueBaixo?: boolean;
  page?: number;
  limit?: number;
}

// Tipos utilitários
export type CreateRequest<T> = Omit<T, 'id' | 'criadoEm' | 'atualizadoEm' | 'ativo'>;
export type UpdateRequest<T> = Partial<Omit<T, 'id' | 'criadoEm' | 'atualizadoEm'>>;

// Constantes
export const UNIDADES_MEDIDA = [
  'TON',
  'KG',
  'G',
  'L',
  'ML',
  'UN',
  'CX',
  'PC',
  'M',
  'M²',
  'M³',
] as const;

export const CATEGORIAS_PRODUTO = [
  'Fertilizante',
  'Corretivo',
  'Fungicida',
  'Inseticida',
  'Herbicida',
  'Sementes',
  'Óleo Mineral',
  'Adjuvante',
  'Outros',
] as const;

export type UnidadeMedida = typeof UNIDADES_MEDIDA[number];
export type CategoriaProduto = typeof CATEGORIAS_PRODUTO[number];
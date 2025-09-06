import {
  Company,
  User,
  Farm,
  Talhao,
  Fornecedor,
  Produto,
  Entrada,
  Saida,
  Estoque,
  ApiResponse,
  PaginatedResponse,
  CompanyFormData,
  UserFormData,
  FarmFormData,
  TalhaoFormData,
  FornecedorFormData,
  ProdutoFormData,
  EntradaFormData,
  SaidaFormData,
  CompanyFilters,
  UserFilters,
  FarmFilters,
  TalhaoFilters,
  FornecedorFilters,
  ProdutoFilters,
  EntradaFilters,
  SaidaFilters,
  EstoqueFilters,
  DashboardStats,
  EstoqueBaixo,
  MovimentacaoRecente,
} from '../types/frontend';

const API_BASE_URL = '/api';

class ApiService {
  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth = true
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        ...(requireAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Autenticação
  async login(email: string, password: string): Promise<{ success: boolean; token?: string; message: string; error?: string }> {
    const response = await this.request<{ success: boolean; token?: string; message: string; error?: string }>('/autenticacao/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
    
    return response;
  }

  async logout(): Promise<void> {
    // O logout será feito via endpoint da API que removerá o cookie
    await this.request('/autenticacao/logout', {
      method: 'POST',
    });
  }


  // Companias
  async getCompanies(filters?: CompanyFilters, page = 1, limit = 10): Promise<PaginatedResponse<Company>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.request(`/companias?${params}`);
  }

  async getCompany(id: string): Promise<ApiResponse<Company>> {
    return this.request(`/companias/${id}`);
  }

  async createCompany(data: CompanyFormData): Promise<ApiResponse<Company>> {
    return this.request('/companias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompany(id: string, data: Partial<CompanyFormData>): Promise<ApiResponse<Company>> {
    return this.request(`/companias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCompany(id: string): Promise<ApiResponse<void>> {
    return this.request(`/companias/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers(filters?: UserFilters, page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.request(`/usuarios?${params}`);
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request(`/usuarios/${id}`);
  }

  async createUser(data: UserFormData): Promise<ApiResponse<User>> {
    return this.request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<UserFormData>): Promise<ApiResponse<User>> {
    return this.request(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  }

  // Fazendas
  async getFazendas(filters?: FarmFilters, page = 1, limit = 10): Promise<PaginatedResponse<Farm>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.request(`/fazendas?${params}`);
  }

  async getFazenda(id: string): Promise<ApiResponse<Farm>> {
    return this.request(`/fazendas/${id}`);
  }

  async createFazenda(data: FarmFormData): Promise<ApiResponse<Farm>> {
    return this.request('/fazendas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFazenda(id: string, data: Partial<FarmFormData>): Promise<ApiResponse<Farm>> {
    return this.request(`/fazendas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFazenda(id: string): Promise<ApiResponse<void>> {
    return this.request(`/fazendas/${id}`, {
      method: 'DELETE',
    });
  }

  // Talhões
  async getTalhoes(filters?: TalhaoFilters, page = 1, limit = 10): Promise<PaginatedResponse<Talhao>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    // Add filter parameters if they exist
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.request(`/talhoes?${params}`);
  }

  async getTalhao(id: string): Promise<ApiResponse<Talhao>> {
    return this.request(`/talhoes/${id}`);
  }

  async createTalhao(data: TalhaoFormData): Promise<ApiResponse<Talhao>> {
    return this.request('/talhoes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTalhao(id: string, data: Partial<TalhaoFormData>): Promise<ApiResponse<Talhao>> {
    return this.request(`/talhoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTalhao(id: string): Promise<ApiResponse<void>> {
    return this.request(`/talhoes/${id}`, {
      method: 'DELETE',
    });
  }

  // Fornecedores
  async getFornecedores(filters?: FornecedorFilters, page = 1, limit = 10): Promise<PaginatedResponse<Fornecedor>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return this.request(`/fornecedores?${params}`);
  }

  async getFornecedor(id: string): Promise<ApiResponse<Fornecedor>> {
    return this.request(`/fornecedores/${id}`);
  }

  async createFornecedor(data: FornecedorFormData): Promise<ApiResponse<Fornecedor>> {
    return this.request('/fornecedores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFornecedor(id: string, data: Partial<FornecedorFormData>): Promise<ApiResponse<Fornecedor>> {
    return this.request(`/fornecedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFornecedor(id: string): Promise<ApiResponse<void>> {
    return this.request(`/fornecedores/${id}`, {
      method: 'DELETE',
    });
  }

  // Produtos
  async getProdutos(filters?: ProdutoFilters, page = 1, limit = 10): Promise<PaginatedResponse<Produto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return this.request(`/produtos?${params}`);
  }

  async getProduto(id: string): Promise<ApiResponse<Produto>> {
    return this.request(`/produtos/${id}`);
  }

  async createProduto(data: ProdutoFormData): Promise<ApiResponse<Produto>> {
    return this.request('/produtos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduto(id: string, data: Partial<ProdutoFormData>): Promise<ApiResponse<Produto>> {
    return this.request(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduto(id: string): Promise<ApiResponse<void>> {
    return this.request(`/produtos/${id}`, {
      method: 'DELETE',
    });
  }

  // Entradas
  async getEntradas(filters?: EntradaFilters, page = 1, limit = 10): Promise<PaginatedResponse<Entrada>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return this.request(`/entradas?${params}`);
  }

  async getEntrada(id: string): Promise<ApiResponse<Entrada>> {
    return this.request(`/entradas/${id}`);
  }

  async createEntrada(data: EntradaFormData): Promise<ApiResponse<Entrada>> {
    return this.request('/entradas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEntrada(id: string, data: Partial<EntradaFormData>): Promise<ApiResponse<Entrada>> {
    return this.request(`/entradas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEntrada(id: string): Promise<ApiResponse<void>> {
    return this.request(`/entradas/${id}`, {
      method: 'DELETE',
    });
  }

  // Saídas
  async getSaidas(filters?: SaidaFilters, page = 1, limit = 10): Promise<PaginatedResponse<Saida>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    return this.request(`/saidas?${params}`);
  }

  async getSaida(id: string): Promise<ApiResponse<Saida>> {
    return this.request(`/saidas/${id}`);
  }

  async createSaida(data: SaidaFormData): Promise<ApiResponse<Saida>> {
    return this.request('/saidas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSaida(id: string, data: Partial<SaidaFormData>): Promise<ApiResponse<Saida>> {
    return this.request(`/saidas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSaida(id: string): Promise<ApiResponse<void>> {
    return this.request(`/saidas/${id}`, {
      method: 'DELETE',
    });
  }

  // Estoque
  async getEstoque(filters?: EstoqueFilters, page = 1, limit = 10): Promise<PaginatedResponse<Estoque>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    // Add filter parameters if they exist
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.request(`/estoque?${params}`);
  }

  async ajustarEstoque(data: {
    produtoId: string;
    quantidade: number;
    tipo: 'positivo' | 'negativo';
    observacoes?: string;
  }): Promise<ApiResponse<Estoque>> {
    return this.request('/estoque', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/dashboard/stats');
  }

  async getEstoqueBaixo(): Promise<ApiResponse<EstoqueBaixo[]>> {
    return this.request('/dashboard/estoque-baixo');
  }

  async getMovimentacoesRecentes(limit = 10): Promise<ApiResponse<MovimentacaoRecente[]>> {
    return this.request(`/dashboard/movimentacoes-recentes?limit=${limit}`);
  }
}

export const apiService = new ApiService();
export default apiService;
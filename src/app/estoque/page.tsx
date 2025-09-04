'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Eye, Package, AlertTriangle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { apiService } from '@/services/api';
import { Estoque, Produto, Fornecedor } from '@/types/frontend';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<Estoque[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>(''); // all, low, zero
  const [viewingEstoque, setViewingEstoque] = useState<Estoque | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    loadEstoque();
    loadProdutos();
    loadFornecedores();
  }, [page, searchTerm, selectedCategoria, selectedFornecedor, stockFilter]);

  const loadEstoque = async () => {
    try {
      setLoading(true);
      const filters = {
        ...(selectedCategoria && selectedCategoria !== 'all' && { categoria: selectedCategoria }),
        ...(selectedFornecedor && selectedFornecedor !== 'all' && { fornecedorId: selectedFornecedor }),
        ...(stockFilter === 'low' && { estoqueMinimo: true }),
        ...(stockFilter === 'zero' && { semEstoque: true }),
      };
      const response = await apiService.getEstoque(filters, page, 10);
      setEstoque(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o estoque.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProdutos = async () => {
    try {
      const response = await apiService.getProdutos({}, 1, 1000);
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadFornecedores = async () => {
    try {
      const response = await apiService.getFornecedores({}, 1, 1000);
      setFornecedores(response.data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const filteredEstoque = estoque.filter(item => {
    const matchesSearch = item.produto?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.produto?.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatQuantity = (quantity: number, unidade: string) => {
    return `${new Intl.NumberFormat('pt-BR').format(quantity)} ${unidade}`;
  };

  const getStockStatus = (item: Estoque) => {
    if (item.quantidade === 0) {
      return { status: 'zero', label: 'Sem estoque', variant: 'destructive' as const };
    }
    if (item.quantidade <= (item.quantidadeMinima || 0)) {
      return { status: 'low', label: 'Estoque baixo', variant: 'secondary' as const };
    }
    return { status: 'normal', label: 'Normal', variant: 'default' as const };
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'zero':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'low':
        return <TrendingDown className="h-4 w-4 text-yellow-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
  };

  const getTotalValue = () => {
    return estoque.reduce((total, item) => {
      return total + (item.quantidade * item.valorMedio);
    }, 0);
  };

  const getLowStockCount = () => {
    return estoque.filter(item => item.quantidade <= (item.quantidadeMinima || 0) && item.quantidade > 0).length;
  };

  const getZeroStockCount = () => {
    return estoque.filter(item => item.quantidade === 0).length;
  };

  const categorias = Array.from(new Set(produtos.map(p => p.categoria)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">
            Visualize e monitore o estoque atual de todos os produtos
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estoque.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(getTotalValue())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getLowStockCount()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getZeroStockCount()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar produtos específicos no estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[250px]"
              />
            </div>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                {fornecedores.map((fornecedor) => (
                  <SelectItem key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status do estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="low">Estoque baixo</SelectItem>
                <SelectItem value="zero">Sem estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Estoque Atual</CardTitle>
          <CardDescription>
            {filteredEstoque.length} produto(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Carregando estoque...</p>
            </div>
          ) : filteredEstoque.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum produto encontrado no estoque.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade Atual</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstoque.map((item) => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{item.produto?.nome}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.produto?.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStockIcon(stockStatus.status)}
                          <span className="font-medium">
                            {formatQuantity(item.quantidade, item.produto?.unidade || 'un')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {formatQuantity(item.quantidadeMinima || 0, item.produto?.unidade || 'un')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(item.ultimaAtualizacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingEstoque(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de visualização */}
      <Dialog open={!!viewingEstoque} onOpenChange={() => setViewingEstoque(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Estoque</DialogTitle>
            <DialogDescription>
              Informações completas do produto em estoque.
            </DialogDescription>
          </DialogHeader>
          {viewingEstoque && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Produto</label>
                  <p className="text-sm text-muted-foreground">
                    {viewingEstoque.produto?.nome}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <p className="text-sm text-muted-foreground">
                    {viewingEstoque.produto?.categoria}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Observações</label>
                <p className="text-sm text-muted-foreground">
                  {viewingEstoque.produto?.descricao || 'Nenhuma observação disponível'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Quantidade Atual</label>
                  <p className="text-sm text-muted-foreground">
                    {formatQuantity(viewingEstoque.quantidade, viewingEstoque.produto?.unidade || 'un')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estoque Mínimo</label>
                  <p className="text-sm text-muted-foreground">
                    {formatQuantity(viewingEstoque.quantidadeMinima || 0, viewingEstoque.produto?.unidade || 'un')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Valor Médio</label>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(viewingEstoque.valorMedio)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Total</label>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(viewingEstoque.quantidade * viewingEstoque.valorMedio)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Status do Estoque</label>
                <div className="flex items-center gap-2 mt-1">
                  {getStockIcon(getStockStatus(viewingEstoque).status)}
                  <Badge variant={getStockStatus(viewingEstoque).variant}>
                    {getStockStatus(viewingEstoque).label}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Última Atualização</label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(viewingEstoque.ultimaAtualizacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Eye, TrendingUp, Package, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiService } from '@/services/api';
import { Entrada, Produto, Fornecedor, EntradaFormData, entradaSchema } from '@/types/frontend';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EntradasPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduto, setSelectedProduto] = useState<string>('');
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingEntrada, setViewingEntrada] = useState<Entrada | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const form = useForm<EntradaFormData>({
    resolver: zodResolver(entradaSchema),
    defaultValues: {
      tipo: 'COMPRA',
      produtoId: '',
      fornecedorId: '',
      quantidade: 0,
      valorUnitario: 0,
      valorTotal: 0,
      observacoes: '',
      dataEntrada: new Date().toISOString().split('T')[0],
      numeroNota: '',
    },
  });

  // Watch para calcular valor total automaticamente
  const watchedQuantidade = form.watch('quantidade');
  const watchedValorUnitario = form.watch('valorUnitario');
  const watchedTipo = form.watch('tipo');

  useEffect(() => {
    const quantidade = watchedQuantidade || 0;
    const valorUnitario = watchedValorUnitario || 0;
    const valorTotal = quantidade * valorUnitario;
    form.setValue('valorTotal', valorTotal);
  }, [watchedQuantidade, watchedValorUnitario, form]);

  useEffect(() => {
    loadEntradas();
    loadProdutos();
    loadFornecedores();
  }, [page, searchTerm, selectedProduto, selectedFornecedor]);

  const loadEntradas = async () => {
    try {
      setLoading(true);
      const filters = {
        ...(selectedProduto && selectedProduto !== 'all' && { produtoId: selectedProduto }),
        ...(selectedFornecedor && selectedFornecedor !== 'all' && { fornecedorId: selectedFornecedor }),
      };
      const response = await apiService.getEntradas(filters, page, 10);
      setEntradas(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as entradas.',
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

  const handleSubmit = async (data: EntradaFormData) => {
    try {
      const submitData = {
        ...data,
        // Para transferências, remover campos relacionados a compra
        ...(data.tipo === 'TRANSFERENCIA_POSITIVA' && {
          fornecedorId: undefined,
          valorUnitario: undefined,
          valorTotal: undefined,
          numeroNota: data.numeroNota || undefined,
        }),
        // Para compras, garantir que fornecedor está presente
        ...(data.tipo === 'COMPRA' && {
          fornecedorId: data.fornecedorId || undefined,
        }),
      };
      
      await apiService.createEntrada(submitData);
      toast({
        title: 'Sucesso',
        description: 'Entrada registrada com sucesso.',
      });
      setIsDialogOpen(false);
      form.reset();
      loadEntradas();
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a entrada.',
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = () => {
    form.reset({
      tipo: 'COMPRA',
      produtoId: '',
      fornecedorId: '',
      quantidade: 0,
      valorUnitario: 0,
      valorTotal: 0,
      observacoes: '',
      dataEntrada: new Date().toISOString().split('T')[0],
      numeroNota: '',
    });
    setIsDialogOpen(true);
  };

  // Limpar fornecedor quando tipo não for COMPRA
  useEffect(() => {
    if (watchedTipo !== 'COMPRA') {
      form.setValue('fornecedorId', '');
      form.setValue('valorUnitario', 0);
      form.setValue('valorTotal', 0);
    }
  }, [watchedTipo, form]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatQuantity = (quantity: number, unidade: string) => {
    return `${new Intl.NumberFormat('pt-BR').format(quantity)} ${unidade}`;
  };

  const getTotalValue = () => {
    return entradas.reduce((total, entrada) => total + (entrada.quantidade * entrada.valorUnitario), 0);
  };

  const getTotalQuantity = () => {
    return entradas.reduce((total, entrada) => total + entrada.quantidade, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entradas</h1>
          <p className="text-muted-foreground">
            Registre e acompanhe as entradas de produtos no estoque
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrada
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entradas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalValue())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Únicos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(entradas.map(e => e.produtoId)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entradas.filter(e => {
                const today = new Date();
                const entradaDate = new Date(e.dataEntrada);
                return entradaDate.toDateString() === today.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar entradas específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedProduto} onValueChange={setSelectedProduto}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {produtos.map((produto) => (
                  <SelectItem key={produto.id} value={produto.id}>
                    {produto.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
              <SelectTrigger className="w-[200px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Tabela de entradas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Entradas</CardTitle>
          <CardDescription>
            {entradas.length} entrada(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Carregando entradas...</p>
            </div>
          ) : entradas.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma entrada encontrada.</p>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Registrar primeira entrada
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entradas.map((entrada) => (
                  <TableRow key={entrada.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(entrada.dataEntrada), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={entrada.tipo === 'COMPRA' ? 'default' : 'outline'}>
                        {entrada.tipo === 'COMPRA' ? 'Compra' : 'Transferência +'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{entrada.produto?.nome || 'Produto não informado'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entrada.fornecedor ? (
                        <span className="text-sm">{entrada.fornecedor.nome}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Transferência</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatQuantity(entrada.quantidade, entrada.produto?.unidade || 'un')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {entrada.tipo === 'COMPRA' && entrada.valorUnitario ? (
                        formatCurrency(entrada.valorUnitario)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {entrada.tipo === 'COMPRA' && entrada.valorUnitario ? (
                        formatCurrency(entrada.quantidade * entrada.valorUnitario)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingEntrada(entrada)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Dialog de criação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Entrada</DialogTitle>
            <DialogDescription>
              Registre uma nova entrada de produto no estoque.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Entrada *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="COMPRA">Compra</SelectItem>
                        <SelectItem value="TRANSFERENCIA_POSITIVA">Transferência Positiva</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="produtoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            <div className="flex flex-col">
                              <span>{produto.nome}</span>
                              <span className="text-xs text-muted-foreground">
                                {produto.categoria} - {produto.unidade}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {watchedTipo === 'COMPRA' && (
                <FormField
                  control={form.control}
                  name="fornecedorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um fornecedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fornecedores.map((fornecedor) => (
                            <SelectItem key={fornecedor.id} value={fornecedor.id}>
                              {fornecedor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataEntrada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Entrada *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numeroNota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Nota</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Número da nota fiscal"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {watchedTipo === 'COMPRA' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="valorUnitario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Unitário *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="valorTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              readOnly
                              className="bg-muted"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações sobre a entrada"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" onClick={() => console.log(form.getValues())}>Registrar Entrada</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualização */}
      <Dialog open={!!viewingEntrada} onOpenChange={() => setViewingEntrada(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Entrada</DialogTitle>
            <DialogDescription>
              Informações completas da entrada selecionada.
            </DialogDescription>
          </DialogHeader>
          {viewingEntrada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data da Entrada</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(viewingEntrada.dataEntrada), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Badge variant={viewingEntrada.tipo === 'COMPRA' ? 'default' : 'secondary'}>
                    {viewingEntrada.tipo === 'COMPRA' ? 'Compra' : 'Transferência Positiva'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Produto</label>
                  <p className="text-sm text-muted-foreground">
                    {viewingEntrada.produto?.nome || 'Produto não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantidade</label>
                  <p className="text-sm text-muted-foreground">
                    {formatQuantity(viewingEntrada.quantidade, viewingEntrada.produto?.unidade || 'un')}
                  </p>
                </div>
              </div>
              {viewingEntrada.tipo === 'COMPRA' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Fornecedor</label>
                      <p className="text-sm text-muted-foreground">
                        {viewingEntrada.fornecedor?.nome || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Número da Nota</label>
                      <p className="text-sm text-muted-foreground">
                        {viewingEntrada.valorUnitario || 'Não informado'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Preço Unitário</label>
                      <p className="text-sm text-muted-foreground">
                        {viewingEntrada.valorUnitario ? formatCurrency(viewingEntrada.valorUnitario) : 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Valor Total</label>
                      <p className="text-lg font-bold">
                        {viewingEntrada.valorUnitario ? formatCurrency(viewingEntrada.quantidade * viewingEntrada.valorUnitario) : 'Não informado'}
                      </p>
                    </div>
                  </div>
                </>
              )}
              {viewingEntrada.observacoes && (
                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <p className="text-sm text-muted-foreground">
                    {viewingEntrada.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
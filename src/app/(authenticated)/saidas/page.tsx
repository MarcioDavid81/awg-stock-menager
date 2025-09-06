'use client';

import { useEffect, useState, useCallback } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, Eye, Edit, Trash2, TrendingDown, Package, Calendar, MapPin, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiService } from '@/services/api';
import { Saida, Produto, Talhao, SaidaFormData, saidaSchema } from '@/types/frontend';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast as info } from 'sonner'

export default function SaidasPage() {
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduto, setSelectedProduto] = useState<string>('');
  const [selectedTalhao, setSelectedTalhao] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingSaida, setViewingSaida] = useState<Saida | null>(null);
  const [editingSaida, setEditingSaida] = useState<Saida | null>(null);
  const [deletingSaida, setDeletingSaida] = useState<Saida | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
 

  const form = useForm<SaidaFormData>({
    resolver: zodResolver(saidaSchema),
    defaultValues: {
      tipo: 'APLICACAO',
      produtoId: '',
      talhaoId: '',
      quantidade: 0,
      observacoes: '',
      dataSaida: new Date().toISOString().split('T')[0],
    },
  });

  const tipoSaida = form.watch('tipo');

  const loadSaidas = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        ...(selectedProduto && selectedProduto !== 'all' && { produtoId: selectedProduto }),
        ...(selectedTalhao && selectedTalhao !== 'all' && { talhaoId: selectedTalhao }),
      };
      const response = await apiService.getSaidas(filters, page, 10);
      setSaidas(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar saídas:', error);
      info.error('Erro ao carregar saídas.');
    } finally {
      setLoading(false);
    }
  }, [selectedProduto, selectedTalhao, page]);

  const loadProdutos = useCallback(async () => {
    try {
      const response = await apiService.getProdutos({}, 1, 1000);
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  }, []);

  const loadTalhoes = useCallback(async () => {
    try {
      const response = await apiService.getTalhoes({}, 1, 1000);
      setTalhoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar talhões:', error);
    }
  }, []);

  useEffect(() => {
    loadSaidas();
    loadProdutos();
    loadTalhoes();
  }, [loadSaidas, loadProdutos, loadTalhoes]);

  const handleSubmit = async (data: SaidaFormData) => {
    setLoading(true);
    try {
      // Preparar dados baseado no tipo de saída
      const submitData = {
        ...data,
        // Converter data para formato ISO datetime
        dataSaida: `${data.dataSaida}T12:00:00.000Z`,
        // Para TRANSFERENCIA_NEGATIVA, remover talhaoId se estiver vazio
        ...(data.tipo === 'TRANSFERENCIA_NEGATIVA' && { talhaoId: undefined }),
      };

      if (editingSaida) {
        await apiService.updateSaida(editingSaida.id, submitData);
        info.success('Saída atualizada com sucesso.');
      } else {
        await apiService.createSaida(submitData);
        info.success('Saída registrada com sucesso.');
      }
      
      setIsDialogOpen(false);
      setEditingSaida(null);
      form.reset();
      loadSaidas();
    } catch (error) {
      console.error('Erro ao processar saída:', error);
      info.error(`${editingSaida ? 'Não foi possível atualizar a saída.' : 'Não foi possível registrar a saída.'}`)
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingSaida(null);
    form.reset({
      tipo: 'APLICACAO',
      produtoId: '',
      talhaoId: '',
      quantidade: 0,
      observacoes: '',
      dataSaida: new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (saida: Saida) => {
    setEditingSaida(saida);
    form.reset({
      tipo: saida.tipo,
      produtoId: saida.produtoId,
      talhaoId: saida.talhaoId || '',
      quantidade: saida.quantidade,
      observacoes: saida.observacoes || '',
      dataSaida: new Date(saida.dataSaida).toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSaida) return;

    try {
      await apiService.deleteSaida(deletingSaida.id);
      info.success('Saída excluída com sucesso.');
      setDeletingSaida(null);
      loadSaidas();
    } catch (error) {
      console.error('Erro ao excluir saída:', error);
      info.error('Erro ao excluir saída.');
    }
  };

  // Limpar talhaoId quando o tipo não for APLICACAO
  useEffect(() => {
    if (tipoSaida !== 'APLICACAO') {
      form.setValue('talhaoId', '');
    }
  }, [tipoSaida, form]);

  const formatQuantity = (quantity: number, unidade: string) => {
    return `${new Intl.NumberFormat('pt-BR').format(quantity)} ${unidade}`;
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saídas</h1>
          <p className="text-muted-foreground">
            Registre e acompanhe as saídas de produtos do estoque
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Saída
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{saidas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Únicos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(saidas.map(s => s.produtoId)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talhões Ativos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(saidas.map(s => s.talhaoId)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {saidas.filter(s => {
                const today = new Date();
                const saidaDate = new Date(s.dataSaida);
                return saidaDate.toDateString() === today.toDateString();
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
            Use os filtros abaixo para encontrar saídas específicas
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
            <Select value={selectedTalhao} onValueChange={setSelectedTalhao}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Talhão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os talhões</SelectItem>
                {talhoes.map((talhao) => (
                  <SelectItem key={talhao.id} value={talhao.id}>
                    {talhao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de saídas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Saídas</CardTitle>
          <CardDescription>
            {saidas.length} saída(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <TrendingDown className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Carregando saídas...</p>
            </div>
          ) : saidas.length === 0 ? (
            <div className="text-center py-8">
              <TrendingDown className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma saída encontrada.</p>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Registrar primeira saída
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saidas.map((saida) => (
                  <TableRow key={saida.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(saida.dataSaida), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={saida.tipo === 'APLICACAO' ? 'default' : 'outline'}>
                        {saida.tipo === 'APLICACAO' ? 'Aplicação' : 'Transferência -'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{saida.produto?.nome || 'Produto não informado'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {saida.tipo === 'APLICACAO' ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{saida.talhao?.nome}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Transferência</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatQuantity(saida.quantidade, saida.produto?.unidade || 'un')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {saida.observacoes ? (
                        <span className="text-sm truncate max-w-[200px] block">
                          {saida.observacoes}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhuma</span>
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
                          <DropdownMenuItem onClick={() => setViewingSaida(saida)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(saida)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingSaida(saida)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
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
            <DialogTitle>{editingSaida ? 'Editar Saída' : 'Nova Saída'}</DialogTitle>
            <DialogDescription>
              {editingSaida ? 'Edite as informações da saída.' : 'Registre uma nova saída de produto do estoque.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Saída *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="APLICACAO">Aplicação</SelectItem>
                        <SelectItem value="TRANSFERENCIA_NEGATIVA">Transferência Negativa</SelectItem>
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
              {tipoSaida === 'APLICACAO' && (
                <FormField
                  control={form.control}
                  name="talhaoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Talhão *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um talhão" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {talhoes.map((talhao) => (
                            <SelectItem key={talhao.id} value={talhao.id}>
                              <div className="flex flex-col">
                                <span>{talhao.nome}</span>
                                <span className="text-xs text-muted-foreground">
                                  {talhao.area} ha - {talhao.localizacao || 'Localização não informada'}
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
              )}
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
              <FormField
                control={form.control}
                name="dataSaida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Saída</FormLabel>
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
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações sobre a saída"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {editingSaida ? 'Atualizar' : 'Registrar Saída'}
                  {loading && <Loader className="ml-2 animate-spin" />}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualização */}
      <Dialog open={!!viewingSaida} onOpenChange={() => setViewingSaida(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Saída</DialogTitle>
            <DialogDescription>
              Informações completas da saída selecionada.
            </DialogDescription>
          </DialogHeader>
          {viewingSaida && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data da Saída</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(viewingSaida.dataSaida), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <p className="text-sm text-muted-foreground">
                    {viewingSaida.tipo === 'APLICACAO' ? 'Aplicação' : 'Transferência Negativa'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Produto</label>
                  <p className="text-sm text-muted-foreground">
                    {viewingSaida.produto?.nome || 'Produto não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantidade</label>
                  <p className="text-sm text-muted-foreground">
                    {formatQuantity(viewingSaida.quantidade, viewingSaida.produto?.unidade || "un")}
                  </p>
                </div>
              </div>
              {viewingSaida.tipo === 'APLICACAO' && (
                <>
                  <div>
                    <label className="text-sm font-medium">Talhão</label>
                    <p className="text-sm text-muted-foreground">
                      {viewingSaida.talhao?.nome || 'Talhão não informado'}
                    </p>
                  </div>
                  {viewingSaida.talhao?.area && (
                    <div>
                      <label className="text-sm font-medium">Área do Talhão</label>
                      <p className="text-sm text-muted-foreground">
                        {viewingSaida.talhao?.area} hectares
                      </p>
                    </div>
                  )}
                  {viewingSaida.talhao?.localizacao && (
                    <div>
                      <label className="text-sm font-medium">Localização do Talhão</label>
                      <p className="text-sm text-muted-foreground">
                        {viewingSaida.talhao?.localizacao}
                      </p>
                    </div>
                  )}
                </>
              )}
              {viewingSaida.observacoes && (
                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <p className="text-sm text-muted-foreground">
                    {viewingSaida.observacoes || 'Nenhuma observação'}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog
        open={!!deletingSaida}
        onOpenChange={() => setDeletingSaida(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta saída de &quot;{deletingSaida?.produto?.nome}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
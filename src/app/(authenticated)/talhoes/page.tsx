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
import { Plus, Search, MoreHorizontal, Edit, Trash2, MapPin, Ruler, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiService } from '@/services/api';
import { Farm, Talhao, TalhaoFormData, talhaoSchema } from '@/types/frontend';
import { toast as info } from 'sonner';
import { useUser } from '@/contexts/user-context';
import { DefineAbilityFor } from '../../../../lib/role-ability';

export default function TalhoesPage() {
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [fazendas, setFazendas] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTalhao, setEditingTalhao] = useState<Talhao | null>(null);
  const [deletingTalhao, setDeletingTalhao] = useState<Talhao | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
   const { user } = useUser();
  const ability = user
    ? DefineAbilityFor({ id: user.id, role: user.role })
    : null;


  const form = useForm<TalhaoFormData>({
    resolver: zodResolver(talhaoSchema),
    defaultValues: {
      nome: '',
      area: 0,
      farmId: '',
      observacoes: '',
    },
  });

  useEffect(() => {
    const loadFazendas = async () => {
      try {
        const response = await apiService.getFazendas();
        setFazendas(response.data);
      } catch (error) {
        console.error('Erro ao carregar fazendas:', error);
        info.error('Não foi possível carregar as fazendas.');
      }
    };
    loadFazendas();
  }, [isDialogOpen]);

  const loadTalhoes = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        ...(searchTerm && { nome: searchTerm }),
      };
      const response = await apiService.getTalhoes(filters, page, 10);
      setTalhoes(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar talhões:', error);
      info.error('Não foi possível carregar os talhões.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    loadTalhoes();
  }, [loadTalhoes]);

  const handleSubmit = async (data: TalhaoFormData) => {
    setLoading(true);
    try {
      if (editingTalhao) {
        await apiService.updateTalhao(editingTalhao.id, data);
        info.success('Talhão atualizado com sucesso.');
      } else {
        await apiService.createTalhao(data);
        info.success('Talhão criado com sucesso.');
      }
      setIsDialogOpen(false);
      setEditingTalhao(null);
      form.reset();
      loadTalhoes();
    } catch (error) {
      console.error('Erro ao salvar talhão:', error);
      info.error('Não foi possível salvar o talhão.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (talhao: Talhao) => {
    setLoading(true);
    setEditingTalhao(talhao);
    form.reset({
      nome: talhao.nome,
      area: talhao.area,
      localizacao: talhao.localizacao || '',
      observacoes: talhao.observacoes || '',
      farmId: talhao.farmId || '',
    });
    setIsDialogOpen(true);
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    if (!deletingTalhao) return;

    try {
      await apiService.deleteTalhao(deletingTalhao.id);
      info.success('Talhão excluído com sucesso.');
      setDeletingTalhao(null);
      loadTalhoes();
    } catch (error) {
      console.error('Erro ao excluir talhão:', error);
      info.error('Não foi possível excluir o talhão.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTalhao(null);
    form.reset({
      nome: '',
      area: 0,
      localizacao: '',
      observacoes: '',
      farmId: '',
    });
    setIsDialogOpen(true);
  };

  const formatArea = (area: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(area);
  };

  const getTotalArea = () => {
    return talhoes.reduce((total, talhao) => total + talhao.area, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Talhões</h1>
          <p className="text-muted-foreground">
            Gerencie as áreas de plantio da sua propriedade
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Talhão
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Talhões</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{talhoes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área Total</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatArea(getTotalArea())} ha</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área Média</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {talhoes.length > 0 ? formatArea(getTotalArea() / talhoes.length) : '0,00'} ha
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar talhões específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de talhões */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Talhões</CardTitle>
          <CardDescription>
            {talhoes.length} talhão(ões) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Carregando talhões...</p>
            </div>
          ) : talhoes.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum talhão encontrado.</p>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro talhão
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Área (ha)</TableHead>
                  <TableHead>Fazenda</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talhoes.map((talhao) => (
                  <TableRow key={talhao.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {talhao.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {formatArea(talhao.area)} ha
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {talhao.farm ? (
                        <span className="text-sm">{talhao.farm.name}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não informado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {talhao.observacoes ? (
                        <span className="text-sm truncate max-w-[200px] block">
                          {talhao.observacoes}
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
                          <DropdownMenuItem onClick={() => handleEdit(talhao)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {talhao.userId &&
                            ability?.can("delete", {
                              __typename: "Talhao",
                              id: talhao.id,
                              userId: talhao.userId,
                            }) && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setDeletingTalhao(talhao)
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* Dialog de criação/edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTalhao ? 'Editar Talhão' : 'Novo Talhão'}
            </DialogTitle>
            <DialogDescription>
              {editingTalhao
                ? 'Edite as informações do talhão abaixo.'
                : 'Preencha as informações do novo talhão.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do talhão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="farmId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fazenda</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded border px-2 py-1"
                      >
                        <option value="">Selecione</option>
                        {fazendas.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (hectares) *</FormLabel>
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
                name="localizacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição da localização" {...field} />
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
                        placeholder="Observações sobre o talhão"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {editingTalhao ? 'Atualizar' : 'Criar'}
                  {loading && <Loader className="ml-2 h-4 w-4 animate-spin" />}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog
        open={!!deletingTalhao}
        onOpenChange={() => setDeletingTalhao(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o talhão &quot;{deletingTalhao?.nome}&quot;?
              Esta ação não pode ser desfeita e pode afetar movimentações de estoque associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={loading}>
              Excluir
              {loading && <Loader className="ml-2 h-4 w-4 animate-spin" />}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
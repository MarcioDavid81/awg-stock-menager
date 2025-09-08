"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Package,
  Calendar,
  Loader,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiService } from "@/services/api";
import {
  Entrada,
  Produto,
  Fornecedor,
  EntradaFormData,
  entradaSchema,
} from "@/types/frontend";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast as info } from "sonner";
import { useUser } from "../../../contexts/user-context";
import { DefineAbilityFor } from "../../../../lib/role-ability";

export default function EntradasPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduto, setSelectedProduto] = useState<string>("");
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntrada, setEditingEntrada] = useState<Entrada | null>(null);
  const [viewingEntrada, setViewingEntrada] = useState<Entrada | null>(null);
  const [deletingEntrada, setDeletingEntrada] = useState<Entrada | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { user } = useUser();
  const ability = user ? DefineAbilityFor({ id: user.id, role: user.role }) : null;

  const form = useForm<EntradaFormData>({
    resolver: zodResolver(entradaSchema),
    defaultValues: {
      tipo: "COMPRA",
      produtoId: "",
      fornecedorId: "",
      quantidade: 0,
      valorUnitario: 0,
      valorTotal: 0,
      observacoes: "",
      dataEntrada: new Date().toISOString().split("T")[0],
      numeroNota: "",
    },
  });

  // Watch para calcular valor total automaticamente
  const watchedQuantidade = form.watch("quantidade");
  const watchedValorUnitario = form.watch("valorUnitario");
  const watchedTipo = form.watch("tipo");

  useEffect(() => {
    const quantidade = watchedQuantidade || 0;
    const valorUnitario = watchedValorUnitario || 0;
    const valorTotal = quantidade * valorUnitario;
    form.setValue("valorTotal", valorTotal);
  }, [watchedQuantidade, watchedValorUnitario, form]);

  const loadEntradas = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        ...(selectedProduto &&
          selectedProduto !== "all" && { produtoId: selectedProduto }),
        ...(selectedFornecedor &&
          selectedFornecedor !== "all" && { fornecedorId: selectedFornecedor }),
      };
      const response = await apiService.getEntradas(filters, page, 10);
      setEntradas(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Erro ao carregar entradas:", error);
      info.error("Não foi possível carregar as entradas.");
    } finally {
      setLoading(false);
    }
  }, [page, selectedProduto, selectedFornecedor]);

  const loadProdutos = useCallback(async () => {
    try {
      const response = await apiService.getProdutos({}, 1, 1000);
      setProdutos(response.data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  }, []);

  const loadFornecedores = useCallback(async () => {
    try {
      const response = await apiService.getFornecedores({}, 1, 1000);
      setFornecedores(response.data);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    }
  }, []);

  useEffect(() => {
    loadEntradas();
    loadProdutos();
    loadFornecedores();
  }, [loadEntradas, loadProdutos, loadFornecedores]);

  const handleSubmit = async (data: EntradaFormData) => {
    setLoading(true);
    try {
      const submitData = {
        ...data,
        // Converter data para formato ISO datetime
        dataEntrada: data.dataEntrada
          ? new Date(data.dataEntrada + "T12:00:00").toISOString()
          : undefined,
        // Para transferências, remover campos relacionados a compra
        ...(data.tipo === "TRANSFERENCIA_POSITIVA" && {
          fornecedorId: undefined,
          valorUnitario: undefined,
          valorTotal: undefined,
          numeroNota: data.numeroNota || undefined,
        }),
        // Para compras, garantir que fornecedor está presente e valores são válidos
        ...(data.tipo === "COMPRA" && {
          fornecedorId: data.fornecedorId || undefined,
          valorUnitario:
            data.valorUnitario && data.valorUnitario > 0
              ? data.valorUnitario
              : undefined,
          valorTotal:
            data.valorTotal && data.valorTotal > 0
              ? data.valorTotal
              : undefined,
        }),
        // Remover campos com valor 0 ou undefined para evitar erro de validação
        ...((!data.valorUnitario || data.valorUnitario <= 0) && {
          valorUnitario: undefined,
        }),
        ...((!data.valorTotal || data.valorTotal <= 0) && {
          valorTotal: undefined,
        }),
      };

      if (editingEntrada) {
        await apiService.updateEntrada(editingEntrada.id, submitData);
        info.success("Entrada atualizada com sucesso.");
      } else {
        await apiService.createEntrada(submitData);
        info.success("Entrada registrada com sucesso.");
      }

      setIsDialogOpen(false);
      setEditingEntrada(null);
      form.reset();
      loadEntradas();
    } catch (error) {
      console.error("Erro ao processar entrada:", error);
      info.error(
        `${
          editingEntrada
            ? "Não foi possível atualizar a entrada."
            : "Não foi possível registrar a entrada."
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingEntrada(null);
    form.reset({
      tipo: "COMPRA",
      produtoId: "",
      fornecedorId: "",
      quantidade: 0,
      valorUnitario: 0,
      valorTotal: 0,
      observacoes: "",
      dataEntrada: new Date().toISOString().split("T")[0],
      numeroNota: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (entrada: Entrada) => {
    setEditingEntrada(entrada);
    form.reset({
      tipo: entrada.tipo,
      produtoId: entrada.produtoId,
      fornecedorId: entrada.fornecedorId || "",
      quantidade: entrada.quantidade,
      valorUnitario:
        entrada.valorUnitario || (entrada.tipo === "COMPRA" ? 1 : 0),
      valorTotal: entrada.valorTotal || 0,
      observacoes: entrada.observacoes || "",
      dataEntrada: new Date(entrada.dataEntrada).toISOString().split("T")[0],
      numeroNota: entrada.numeroNota || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingEntrada) return;

    try {
      await apiService.deleteEntrada(deletingEntrada.id);
      info.success("Entrada excluída com sucesso.");
      setDeletingEntrada(null);
      loadEntradas();
    } catch (error) {
      console.error("Erro ao excluir entrada:", error);
      info.error("Não foi possível excluir a entrada.");
    }
  };

  // Limpar fornecedor quando tipo não for COMPRA
  useEffect(() => {
    if (watchedTipo !== "COMPRA") {
      form.setValue("fornecedorId", "");
      form.setValue("valorUnitario", 0);
      form.setValue("valorTotal", 0);
    }
  }, [watchedTipo, form]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatQuantity = (quantity: number, unidade: string) => {
    return `${new Intl.NumberFormat("pt-BR").format(quantity)} ${unidade}`;
  };

  const getTotalValue = () => {
    return entradas.reduce(
      (total, entrada) => total + entrada.quantidade * entrada.valorUnitario,
      0
    );
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
        {ability?.can("create", "Entrada") && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Entrada
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Entradas
            </CardTitle>
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
            <div className="text-2xl font-bold">
              {formatCurrency(getTotalValue())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos Únicos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(entradas.map((e) => e.produtoId)).size}
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
              {
                entradas.filter((e) => {
                  const today = new Date();
                  const entradaDate = new Date(e.dataEntrada);
                  return entradaDate.toDateString() === today.toDateString();
                }).length
              }
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
            <Select
              value={selectedFornecedor}
              onValueChange={setSelectedFornecedor}
            >
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
              <p className="text-muted-foreground">
                Nenhuma entrada encontrada.
              </p>
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
                          {format(new Date(entrada.dataEntrada), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entrada.tipo === "COMPRA" ? "default" : "outline"
                        }
                      >
                        {entrada.tipo === "COMPRA"
                          ? "Compra"
                          : "Transferência +"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>
                          {entrada.produto?.nome || "Produto não informado"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entrada.fornecedor ? (
                        <span className="text-sm">
                          {entrada.fornecedor.nome}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Transferência
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatQuantity(
                          entrada.quantidade,
                          entrada.produto?.unidade || "un"
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {entrada.tipo === "COMPRA" && entrada.valorUnitario ? (
                        formatCurrency(entrada.valorUnitario)
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {entrada.tipo === "COMPRA" && entrada.valorUnitario ? (
                        formatCurrency(
                          entrada.quantidade * entrada.valorUnitario
                        )
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
                          <DropdownMenuItem
                            onClick={() => setViewingEntrada(entrada)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {entrada.userId && ability?.can("update", { __typename: "Entrada", id: entrada.id, userId: entrada.userId }) && (
                            <DropdownMenuItem
                              onClick={() => openEditDialog(entrada)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {entrada.userId && ability?.can("delete", { __typename: "Entrada", id: entrada.id, userId: entrada.userId }) && (
                            <DropdownMenuItem
                              onClick={() => setDeletingEntrada(entrada)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
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

      {/* Dialog de criação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingEntrada ? "Editar Entrada" : "Nova Entrada"}
            </DialogTitle>
            <DialogDescription>
              {editingEntrada
                ? "Edite os dados da entrada de produto."
                : "Registre uma nova entrada de produto no estoque."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
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
                        <SelectItem value="TRANSFERENCIA_POSITIVA">
                          Transferência Positiva
                        </SelectItem>
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
              {watchedTipo === "COMPRA" && (
                <FormField
                  control={form.control}
                  name="fornecedorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um fornecedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fornecedores.map((fornecedor) => (
                            <SelectItem
                              key={fornecedor.id}
                              value={fornecedor.id}
                            >
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
                        <Input type="date" {...field} />
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
                        <Input placeholder="Número da nota fiscal" {...field} />
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
              {watchedTipo === "COMPRA" && (
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
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
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
                <Button type="submit" disabled={loading}>
                  {editingEntrada ? "Atualizar Entrada" : "Registrar Entrada"}
                  {loading && <Loader className="ml-2 animate-spin" />}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualização */}
      <Dialog
        open={!!viewingEntrada}
        onOpenChange={() => setViewingEntrada(null)}
      >
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
                    {format(
                      new Date(viewingEntrada.dataEntrada),
                      "dd/MM/yyyy HH:mm",
                      { locale: ptBR }
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Badge
                    variant={
                      viewingEntrada.tipo === "COMPRA" ? "default" : "secondary"
                    }
                  >
                    {viewingEntrada.tipo === "COMPRA"
                      ? "Compra"
                      : "Transferência Positiva"}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Produto</label>
                  <p className="text-sm text-muted-foreground">
                    {viewingEntrada.produto?.nome || "Produto não informado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantidade</label>
                  <p className="text-sm text-muted-foreground">
                    {formatQuantity(
                      viewingEntrada.quantidade,
                      viewingEntrada.produto?.unidade || "un"
                    )}
                  </p>
                </div>
              </div>
              {viewingEntrada.tipo === "COMPRA" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Fornecedor</label>
                      <p className="text-sm text-muted-foreground">
                        {viewingEntrada.fornecedor?.nome || "Não informado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Número da Nota
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {viewingEntrada.valorUnitario || "Não informado"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Preço Unitário
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {viewingEntrada.valorUnitario
                          ? formatCurrency(viewingEntrada.valorUnitario)
                          : "Não informado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Valor Total</label>
                      <p className="text-lg font-bold">
                        {viewingEntrada.valorUnitario
                          ? formatCurrency(
                              viewingEntrada.quantidade *
                                viewingEntrada.valorUnitario
                            )
                          : "Não informado"}
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

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog
        open={!!deletingEntrada}
        onOpenChange={() => setDeletingEntrada(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta entrada de &quot;
              {deletingEntrada?.produto?.nome}&quot;? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

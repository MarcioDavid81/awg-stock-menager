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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Loader,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiService } from "@/services/api";
import {
  Fornecedor,
  FornecedorFormData,
  fornecedorSchema,
} from "@/types/frontend";
import { toast as info } from "sonner";
import { useUser } from "@/contexts/user-context";
import { DefineAbilityFor } from "../../../../lib/role-ability";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(
    null
  );
  const [deletingFornecedor, setDeletingFornecedor] =
    useState<Fornecedor | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tipoPessoa, setTipoPessoa] = useState<"juridica" | "fisica">(
    "juridica"
  );
  const { user } = useUser();
  const ability = user
    ? DefineAbilityFor({ id: user.id, role: user.role })
    : null;

  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      cpf: "",
      telefone: "",
      email: "",
      endereco: "",
    },
  });

  const tipoWatch = form.watch(["cnpj", "cpf"]);

  useEffect(() => {
    const [cnpj, cpf] = tipoWatch;
    if (cnpj && !cpf) {
      setTipoPessoa("juridica");
    } else if (cpf && !cnpj) {
      setTipoPessoa("fisica");
    }
  }, [tipoWatch]);

  const loadFornecedores = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        ...(searchTerm && { nome: searchTerm }),
      };
      const response = await apiService.getFornecedores(filters, page, 10);
      setFornecedores(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      info("Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    loadFornecedores();
  }, [loadFornecedores]);

  const handleSubmit = async (data: FornecedorFormData) => {
    try {
      if (editingFornecedor) {
        await apiService.updateFornecedor(editingFornecedor.id, data);
        info.success("Fornecedor atualizado com sucesso.");
      } else {
        await apiService.createFornecedor(data);
        info.success("Fornecedor criado com sucesso.");
      }
      setIsDialogOpen(false);
      setEditingFornecedor(null);
      form.reset();
      loadFornecedores();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      info.error("Erro ao salvar fornecedor.");
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    const tipo = fornecedor.cnpj ? "juridica" : "fisica";
    setTipoPessoa(tipo);
    form.reset({
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj || "",
      cpf: fornecedor.cpf || "",
      telefone: fornecedor.telefone || "",
      email: fornecedor.email || "",
      endereco: fornecedor.endereco || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingFornecedor) return;

    try {
      await apiService.deleteFornecedor(deletingFornecedor.id);
      info.success("Fornecedor excluído com sucesso.");
      setDeletingFornecedor(null);
      loadFornecedores();
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      info.error("Erro ao excluir fornecedor.");
    }
  };

  const openCreateDialog = () => {
    setEditingFornecedor(null);
    setTipoPessoa("juridica");
    form.reset({
      nome: "",
      cnpj: "",
      cpf: "",
      telefone: "",
      email: "",
      endereco: "",
    });
    setIsDialogOpen(true);
  };

  const handleTipoPessoaChange = (value: "juridica" | "fisica") => {
    setTipoPessoa(value);
    if (value === "juridica") {
      form.setValue("cpf", "");
    } else {
      form.setValue("cnpj", "");
    }
  };

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return "";
    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return "";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (phone: string) => {
    if (!phone) return "";
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie os fornecedores de produtos para sua empresa
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar fornecedores específicos
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

      {/* Tabela de fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
          <CardDescription>
            {fornecedores.length} fornecedor(es) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Carregando fornecedores...
              </p>
            </div>
          ) : fornecedores.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum fornecedor encontrado.
              </p>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro fornecedor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedores.map((fornecedor) => (
                  <TableRow key={fornecedor.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {fornecedor.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      {fornecedor.cnpj ? (
                        <Badge variant="outline">
                          {formatCNPJ(fornecedor.cnpj)}
                        </Badge>
                      ) : fornecedor.cpf ? (
                        <Badge variant="outline">
                          {formatCPF(fornecedor.cpf)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          Não informado
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {fornecedor.telefone && (
                          <Badge variant="secondary">
                            {formatPhone(fornecedor.telefone)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {fornecedor.endereco ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">
                            {fornecedor.endereco}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Não informado
                        </span>
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
                            onClick={() => handleEdit(fornecedor)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {fornecedor.userId &&
                            ability?.can("delete", {
                              __typename: "Fornecedor",
                              id: fornecedor.id,
                              userId: fornecedor.userId,
                            }) && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setDeletingFornecedor(fornecedor)
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
              {editingFornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}
            </DialogTitle>
            <DialogDescription>
              {editingFornecedor
                ? "Edite as informações do fornecedor abaixo."
                : "Preencha as informações do novo fornecedor."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Tipo de Pessoa</Label>
                  <RadioGroup
                    value={tipoPessoa}
                    onValueChange={handleTipoPessoaChange}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="juridica" id="juridica" />
                      <Label htmlFor="juridica">Pessoa Jurídica</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fisica" id="fisica" />
                      <Label htmlFor="fisica">Pessoa Física</Label>
                    </div>
                  </RadioGroup>
                </div>
                {tipoPessoa === "juridica" ? (
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="00.000.000/0000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contato@empresa.com"
                          type="email"
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
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {editingFornecedor ? "Atualizar" : "Criar"}
                  {loading && <Loader className="ml-2 h-4 w-4 animate-spin" />}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog
        open={!!deletingFornecedor}
        onOpenChange={() => setDeletingFornecedor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor &quot;
              {deletingFornecedor?.nome}&quot;? Esta ação não pode ser desfeita
              e pode afetar produtos associados.
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

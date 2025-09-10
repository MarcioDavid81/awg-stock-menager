"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Edit,
  Trash2,
  MapPin,
  Ruler,
  Loader,
  User as UserIcon,
  Upload,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiService } from "@/services/api";
import { User, UserFormData, userSchema } from "@/types/frontend";
import { toast as info } from "sonner";
import { useUser } from "@/contexts/user-context";
import { DefineAbilityFor } from "../../../../lib/role-ability";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<User | null>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useUser();
  const ability = user
    ? DefineAbilityFor({ id: user.id, role: user.role })
    : null;

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER" as const,
    },
  });

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      setUsuarios(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      info.error("Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  const handleSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("avatarFile", selectedFile);
      }
      if (editingUsuario) {
        await apiService.updateUser(editingUsuario.id, data);
        info.success("Usuário atualizado com sucesso.");
      } else {
        await apiService.createUser(data);
        info.success("Usuário criado com sucesso.");
      }
      setIsDialogOpen(false);
      setEditingUsuario(null);
      form.reset();
      const response = await apiService.getUsers();
      setUsuarios(response.data);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      info.error("Não foi possível salvar o usuário.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usuario: User) => {
    setLoading(true);
    setEditingUsuario(usuario);
    form.reset({
      name: usuario.name,
      email: usuario.email,
      role: usuario.role,
    });
    setIsDialogOpen(true);
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    if (!deletingUsuario) return;

    try {
      await apiService.deleteUser(deletingUsuario.id);
      info.success("Usuário excluído com sucesso.");
      setDeletingUsuario(null);
      const response = await apiService.getUsers();
      setUsuarios(response.data);
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      info.error("Não foi possível excluir o usuário.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingUsuario(null);
    form.reset({
      name: "",
      email: "",
      password: "",
      role: "ADMIN",
    });
    setIsDialogOpen(true);
  };

    const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        info.error(
          "Por favor, selecione um arquivo de imagem (PNG, JPG ou WEBP)"
        );
        setAvatarPreview(null);
        return;
      }

      // Validar tamanho (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        info.error("O arquivo deve ter no máximo 5MB");
        setAvatarPreview(null);
        return;
      }

      setSelectedFile(file);

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários da sua propriedade
          </p>
        </div>
        {/* Apenas ADMIN pode criar novos usuários */}
        {ability?.can('create', 'Usuario') && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Usuários
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuarios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuários ADMIN
            </CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usuarios.filter((u) => u.role === "ADMIN").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários USER</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usuarios.filter((u) => u.role === "USER").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {usuarios.length} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Carregando usuários...</p>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum usuário encontrado.
              </p>
              {/* Apenas ADMIN pode criar usuários */}
              {ability?.can('create', 'Usuario') && (
                <Button onClick={openCreateDialog} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeiro usuário
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        {usuario.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {usuario.email}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {usuario.role === "ADMIN" ? (
                        <Badge variant="default" className="font-mono">
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="font-mono">
                          User
                        </Badge>
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
                          {/* ADMIN pode editar qualquer usuário, USER só pode editar a si mesmo */}
                          {(ability?.can('update', 'Usuario') || 
                            (user?.role === 'USER' && usuario.id === user.id)) && (
                            <DropdownMenuItem onClick={() => handleEdit(usuario)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {/* Apenas ADMIN pode deletar usuários */}
                          {ability?.can('delete', 'Usuario') && (
                            <DropdownMenuItem
                              onClick={() => setDeletingUsuario(usuario)}
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

      {/* Dialog de criação/edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingUsuario ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {editingUsuario
                ? "Edite as informações do usuário abaixo."
                : "Preencha as informações do novo usuário."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={avatarPreview || undefined}
                  alt="Avatar preview"
                />
                <AvatarFallback className="text-lg">
                  {form.watch("name") ? (
                    getUserInitials(form.watch("name"))
                  ) : (
                    <UserIcon className="w-8 h-8" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col items-center space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Selecionar Avatar</span>
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />

                <p className="text-xs text-muted-foreground text-center">
                  PNG, JPG ou WEBP até 5MB
                </p>
              </div>
            </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Nome do usuário"
                        {...field}
                      />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email do usuário"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Senha do usuário"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded border px-2 py-1"
                      >
                        <option value="ADMIN">Administrador</option>
                        <option value="USER">Usuário</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {editingUsuario ? "Atualizar" : "Criar"}
                  {loading && <Loader className="ml-2 h-4 w-4 animate-spin" />}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog
        open={!!deletingUsuario}
        onOpenChange={() => setDeletingUsuario(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário &quot;
              {deletingUsuario?.name}&quot;? Esta ação não pode ser desfeita e
              pode afetar movimentações de estoque associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              Excluir
              {loading && <Loader className="ml-2 h-4 w-4 animate-spin" />}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

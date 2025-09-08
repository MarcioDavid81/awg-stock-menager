"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Entrada } from "@/types/frontend";
import { AppAbility } from "../../../../../lib/role-ability";

interface EntradasTableProps {
  entradas: Entrada[];
  loading: boolean;
  ability: AppAbility | null;
  page: number;
  totalPages: number;
  onCreateClick: () => void;
  onEditClick: (entrada: Entrada) => void;
  onViewClick: (entrada: Entrada) => void;
  onDeleteClick: (entrada: Entrada) => void;
  onPageChange: (page: number) => void;
}

export function EntradasTable({
  entradas,
  loading,
  ability,
  page,
  totalPages,
  onCreateClick,
  onEditClick,
  onViewClick,
  onDeleteClick,
  onPageChange,
}: EntradasTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatQuantity = (quantity: number, unidade: string) => {
    return `${new Intl.NumberFormat("pt-BR").format(quantity)} ${unidade}`;
  };

  return (
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
            <Button onClick={onCreateClick} className="mt-4">
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
                        <DropdownMenuItem onClick={() => onViewClick(entrada)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        {entrada.userId &&
                          ability?.can("update", {
                            __typename: "Entrada",
                            id: entrada.id,
                            userId: entrada.userId,
                          }) && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onEditClick(entrada)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDeleteClick(entrada)}
                                className="text-destructive focus:text-destructive"
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
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
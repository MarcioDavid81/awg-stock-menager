"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Entrada } from "@/types/frontend";
import {
  Calendar,
  Package,
  Building2,
  Hash,
  DollarSign,
  FileText,
} from "lucide-react";

interface EntradaViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrada: Entrada | null;
}

export function EntradaViewDialog({
  open,
  onOpenChange,
  entrada,
}: EntradaViewDialogProps) {
  if (!entrada) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatQuantity = (quantity: number, unidade: string) => {
    return `${new Intl.NumberFormat("pt-BR").format(quantity)} ${unidade}`;
  };

  const valorTotal =
    entrada.tipo === "COMPRA" && entrada.valorUnitario
      ? entrada.quantidade * entrada.valorUnitario
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Entrada</DialogTitle>
          <DialogDescription>
            Informações completas sobre a entrada de estoque
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo e Data */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {format(new Date(entrada.dataEntrada), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
            <Badge
              variant={entrada.tipo === "COMPRA" ? "default" : "outline"}
            >
              {entrada.tipo === "COMPRA" ? "Compra" : "Transferência +"}
            </Badge>
          </div>

          <Separator />

          {/* Produto */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Produto</span>
            </div>
            <div className="ml-6">
              <p className="font-medium">
                {entrada.produto?.nome || "Produto não informado"}
              </p>
              {entrada.produto?.descricao && (
                <p className="text-sm text-muted-foreground">
                  {entrada.produto.descricao}
                </p>
              )}
            </div>
          </div>

          {/* Fornecedor */}
          {entrada.fornecedor && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Fornecedor</span>
              </div>
              <div className="ml-6">
                <p className="font-medium">{entrada.fornecedor.nome}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Quantidade */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Quantidade</span>
            </div>
            <div className="ml-6">
              <Badge variant="outline" className="text-base">
                {formatQuantity(
                  entrada.quantidade,
                  entrada.produto?.unidade || "un"
                )}
              </Badge>
            </div>
          </div>

          {/* Valores (apenas para compras) */}
          {entrada.tipo === "COMPRA" && entrada.valorUnitario && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Valores</span>
              </div>
              <div className="ml-6 space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Valor unitário:
                  </span>
                  <span className="font-mono">
                    {formatCurrency(entrada.valorUnitario)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-sm">Valor total:</span>
                  <span className="font-mono">{formatCurrency(valorTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          {entrada.observacoes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Observações</span>
              </div>
              <div className="ml-6">
                <p className="text-sm text-muted-foreground">
                  {entrada.observacoes}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
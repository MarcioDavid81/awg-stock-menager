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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Entrada } from "@/types/frontend";
import { AlertTriangle } from "lucide-react";

interface EntradaDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrada: Entrada | null;
  loading: boolean;
  onConfirm: () => void;
}

export function EntradaDeleteDialog({
  open,
  onOpenChange,
  entrada,
  loading,
  onConfirm,
}: EntradaDeleteDialogProps) {
  if (!entrada) return null;

  const formatQuantity = (quantity: number, unidade: string) => {
    return `${new Intl.NumberFormat("pt-BR").format(quantity)} ${unidade}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A entrada será permanentemente
            removida do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {format(new Date(entrada.dataEntrada), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </span>
              <Badge
                variant={entrada.tipo === "COMPRA" ? "default" : "outline"}
              >
                {entrada.tipo === "COMPRA" ? "Compra" : "Transferência +"}
              </Badge>
            </div>
            
            <div>
              <p className="font-medium">
                {entrada.produto?.nome || "Produto não informado"}
              </p>
              <p className="text-sm text-muted-foreground">
                Quantidade: {formatQuantity(
                  entrada.quantidade,
                  entrada.produto?.unidade || "un"
                )}
              </p>
              {entrada.fornecedor && (
                <p className="text-sm text-muted-foreground">
                  Fornecedor: {entrada.fornecedor.nome}
                </p>
              )}
            </div>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Atenção: Esta exclusão pode afetar o controle de estoque
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              Certifique-se de que esta entrada não é necessária para o
              histórico de movimentações.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Confirmar Exclusão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
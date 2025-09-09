"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { EntradasStatistics } from "./_components/entradas-statistics";
import { EntradasFilters } from "./_components/entradas-filters";
import { EntradasTable } from "./_components/entradas-table";
import { EntradaFormDialog } from "./_components/entrada-form-dialog";
import { EntradaViewDialog } from "./_components/entrada-view-dialog";
import { EntradaDeleteDialog } from "./_components/entrada-delete-dialog";
import { Plus, MailCheck, OctagonX } from "lucide-react";
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
  const ability = user
    ? DefineAbilityFor({ id: user.id, role: user.role })
    : null;

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
      info.error("Não foi possível carregar as entradas.", {
            style: {
              backgroundColor: "#e7000b",
              color: "white",
          },
          icon: <OctagonX className="text-white font-black  mr-2 h-4 w-4" />,
          });
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
      info.error("Não foi possível carregar os produtos.", {
            style: {
              backgroundColor: "#e7000b",
              color: "white",
          },
          icon: <OctagonX className="text-white font-black  mr-2 h-4 w-4" />,
          });
    }
  }, []);

  const loadFornecedores = useCallback(async () => {
    try {
      const response = await apiService.getFornecedores({}, 1, 1000);
      setFornecedores(response.data);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      info.error("Não foi possível carregar os fornecedores.", {
            style: {
              backgroundColor: "#e7000b",
              color: "white",
          },
          icon: <OctagonX className="text-white font-black  mr-2 h-4 w-4" />,
          });
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
        info.success("Entrada atualizada com sucesso.", {
          style: {
            backgroundColor: "#00c951",
            color: "white",
          },
          icon: <MailCheck className="text-white font-black mr-2 h-4 w-4" />
        });
      } else {
        await apiService.createEntrada(submitData);
        info.success("Entrada registrada com sucesso.", {
          style: {
            backgroundColor: "#00c951",
            color: "white",
          },
          icon: <MailCheck className="text-white font-black mr-2 h-4 w-4" />
        });
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
        }`, {
            style: {
              backgroundColor: "#e7000b",
              color: "white",
          },
          icon: <OctagonX className="text-white font-black  mr-2 h-4 w-4" />,
          }
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
      info.error("Não foi possível excluir a entrada.", {
            style: {
              backgroundColor: "#e7000b",
              color: "white",
          },
          icon: <OctagonX className="text-white font-black  mr-2 h-4 w-4" />,
          });
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
      <EntradasStatistics entradas={entradas} />

      {/* Filtros */}
        <EntradasFilters
          produtos={produtos}
          fornecedores={fornecedores}
          selectedProduto={selectedProduto}
          selectedFornecedor={selectedFornecedor}
          onProdutoChange={setSelectedProduto}
          onFornecedorChange={setSelectedFornecedor}
        />

      {/* Tabela de entradas */}
        <EntradasTable
          entradas={entradas}
          loading={loading}
          ability={ability}
          page={page}
          totalPages={totalPages}
          onCreateClick={openCreateDialog}
          onEditClick={openEditDialog}
          onViewClick={setViewingEntrada}
          onDeleteClick={setDeletingEntrada}
          onPageChange={setPage}
        />

      {/* Diálogos */}
      <EntradaFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        form={form}
        produtos={produtos}
        fornecedores={fornecedores}
        isEditing={!!editingEntrada}
        loading={loading}
        onSubmit={handleSubmit}
      />

      <EntradaViewDialog
        open={!!viewingEntrada}
        onOpenChange={() => setViewingEntrada(null)}
        entrada={viewingEntrada}
      />

      <EntradaDeleteDialog
        open={!!deletingEntrada}
        onOpenChange={() => setDeletingEntrada(null)}
        entrada={deletingEntrada}
        loading={loading}
        onConfirm={handleDelete}
      />
    </div>
  );
}

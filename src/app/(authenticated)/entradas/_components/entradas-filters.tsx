"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Produto, Fornecedor } from "@/types/frontend";

interface EntradasFiltersProps {
  produtos: Produto[];
  fornecedores: Fornecedor[];
  selectedProduto: string;
  selectedFornecedor: string;
  onProdutoChange: (value: string) => void;
  onFornecedorChange: (value: string) => void;
}

export function EntradasFilters({
  produtos,
  fornecedores,
  selectedProduto,
  selectedFornecedor,
  onProdutoChange,
  onFornecedorChange,
}: EntradasFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
        <CardDescription>
          Use os filtros abaixo para encontrar entradas específicas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Select value={selectedProduto} onValueChange={onProdutoChange}>
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
          
          <Select value={selectedFornecedor} onValueChange={onFornecedorChange}>
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
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, Calendar } from "lucide-react";
import { Entrada } from "@/types/frontend";

interface EntradasStatisticsProps {
  entradas: Entrada[];
}

export function EntradasStatistics({ entradas }: EntradasStatisticsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTotalValue = () => {
    return entradas.reduce(
      (total, entrada) => total + entrada.quantidade * (entrada.valorUnitario || 0),
      0
    );
  };

  const getUniqueProducts = () => {
    return new Set(entradas.map((e) => e.produtoId)).size;
  };

  const getTodayEntries = () => {
    return entradas.filter((e) => {
      const today = new Date();
      const entradaDate = new Date(e.dataEntrada);
      return entradaDate.toDateString() === today.toDateString();
    }).length;
  };

  return (
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
          <div className="text-2xl font-bold">{getUniqueProducts()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entradas Hoje</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getTodayEntries()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
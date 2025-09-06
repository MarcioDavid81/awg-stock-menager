'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Users,
  MapPin,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { DashboardStats, EstoqueBaixo, MovimentacaoRecente } from '@/types/frontend';
import Link from 'next/link';
import { toast as info } from 'sonner';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [estoqueBaixo, setEstoqueBaixo] = useState<EstoqueBaixo[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRecente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados reais das APIs
      const [statsRes, estoqueBaixoRes, movimentacoesRes] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getEstoqueBaixo(),
        apiService.getMovimentacoesRecentes(5),
      ]);

      setStats(statsRes.data);
      setEstoqueBaixo(estoqueBaixoRes.data);
      setMovimentacoes(movimentacoesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      info.error('Não foi possível carregar os dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Carregando overview do sistema...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumo de estatísticas do sistema
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProdutos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats?.produtosEstoqueBaixo || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos com estoque baixo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(stats?.valorTotalEstoque || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total do estoque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFornecedores || 0}</div>
            <p className="text-xs text-muted-foreground">
              Fornecedores cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talhões</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTalhoes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Talhões cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats?.entradasMes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Entradas este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas (Mês)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats?.saidasMes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Saídas este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movimentações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.entradasMes || 0) + (stats?.saidasMes || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Produtos com estoque baixo */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos com Estoque Baixo</CardTitle>
            <CardDescription>
              Produtos que precisam de reposição
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estoqueBaixo.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum produto com estoque baixo.
              </p>
            ) : (
              <div className="space-y-3">
                {estoqueBaixo.map((item) => (
                  <div key={item.produto.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.produto.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Atual: {item.quantidadeAtual} | Mínimo: {item.quantidadeMinima}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      -{item.diferenca}
                    </Badge>
                  </div>
                ))}
                <Separator />
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/estoque?estoqueMinimo=true">
                    Ver todos
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Movimentações recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Movimentações Recentes</CardTitle>
            <CardDescription>
              Últimas entradas e saídas do estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            {movimentacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma movimentação recente.
              </p>
            ) : (
              <div className="space-y-3">
                {movimentacoes.map((mov) => (
                  <div key={mov.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {mov.tipo === 'entrada' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{mov.produto}</p>
                        <p className="text-xs text-muted-foreground">
                          {mov.observacoes}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(mov.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )).slice(0, 2)}
                <Separator />
                <div className="flex space-x-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href="/entradas">
                      Ver entradas
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href="/saidas">
                      Ver saídas
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
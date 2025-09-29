import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface MinimalStats {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  loading: boolean;
}

export const IPhoneMinimalDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MinimalStats>({
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    loading: true
  });
  const [error, setError] = useState<string | null>(null);

  const loadMinimalData = async () => {
    try {
      setError(null);
      console.log('iPhone Minimal: Carregando dados básicos...');
      
      // Simular carregamento básico sem hooks complexos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados mockados para teste inicial
      setStats({
        totalReceitas: 5000,
        totalDespesas: 3500,
        saldo: 1500,
        loading: false
      });
      
      console.log('iPhone Minimal: Dados carregados com sucesso');
    } catch (err) {
      console.error('iPhone Minimal: Erro ao carregar dados', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadMinimalData();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Card className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Erro</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadMinimalData} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meu Dinheiro</h1>
          <p className="text-gray-600">Versão iPhone Simplificada</p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Olá, {user.email}
            </p>
          )}
        </div>

        {/* Loading State */}
        {stats.loading && (
          <Card className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </Card>
        )}

        {/* Stats Cards */}
        {!stats.loading && (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Saldo Atual</p>
                  <p className={`text-2xl font-bold ${
                    stats.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    R$ {stats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Receitas</p>
                  <p className="text-xl font-bold text-green-600">
                    R$ {stats.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Despesas</p>
                  <p className="text-xl font-bold text-red-600">
                    R$ {stats.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3 mt-6">
              <Button 
                onClick={() => window.location.href = '/transacoes'} 
                className="w-full"
                variant="outline"
              >
                Ver Transações
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/receitas'} 
                className="w-full"
                variant="outline"
              >
                Gerenciar Receitas
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/despesas'} 
                className="w-full"
                variant="outline"
              >
                Gerenciar Despesas
              </Button>
              
              <Button 
                onClick={loadMinimalData} 
                className="w-full"
                variant="secondary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar Dados
              </Button>
            </div>

            {/* Debug Info */}
            <Card className="p-3 mt-6 bg-blue-50">
              <p className="text-xs text-blue-800 text-center">
                Dashboard Simplificado para iPhone<br/>
                Sem gráficos complexos • Carregamento otimizado
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Utensils,
  TrendingUp as Investment,
  Car,
  AlertTriangle,
  Package,
  CreditCard,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useItensMercado } from "@/hooks/useItensMercado";
import { useDividas } from "@/hooks/useDividas";
import { useVeiculos } from "@/hooks/useVeiculos";
import { useTiposManutencao } from "@/hooks/useTiposManutencao";
import { useManutencoesPendentes } from "@/hooks/useManutencoesPendentes";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { TrialStatusBanner } from "@/components/TrialStatusBanner";
import { BasicAccessBanner } from "@/components/BasicAccessBanner";
import { CreatedByBadge } from "@/components/CreatedByBadge";
import { NotificacaoLembretes } from "@/components/NotificacaoLembretes";
import { useToast } from "@/hooks/use-toast";
import { useLembretes } from "@/hooks/useLembretes";
import { Bell, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Funcao para formatar a data corretamente
const formatarData = (dataString: string) => {
  if (!dataString) return "";
  const [ano, mes, dia] = dataString.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
};

// Funcao para obter a data atual no formato do banco (YYYY-MM-DD)
const getDataAtual = () => {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const dia = String(now.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

// Funcao para obter o primeiro dia da semana no formato do banco (YYYY-MM-DD)
const getPrimeiroDiaSemana = () => {
  const now = new Date();
  const primeiroDia = new Date(now.setDate(now.getDate() - now.getDay()));
  const ano = primeiroDia.getFullYear();
  const mes = String(primeiroDia.getMonth() + 1).padStart(2, "0");
  const dia = String(primeiroDia.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

// Funcao para obter o primeiro dia do mes no formato do banco (YYYY-MM-DD)
const getPrimeiroDiaMes = () => {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}-01`;
};

// Funcao para obter o primeiro dia do ano no formato do banco (YYYY-MM-DD)
const getPrimeiroDiaAno = () => {
  const now = new Date();
  const ano = now.getFullYear();
  return `${ano}-01-01`;
};

// Funcao para comparar datas no formato do banco (YYYY-MM-DD)
const compararDatas = (data1: string, data2: string) => {
  return data1 >= data2;
};

// Funcao para formatar o nome do mes
const formatarMes = (mes: number) => {
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return meses[mes - 1];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState("mes");
  const { toast } = useToast();

  const { transacoes, loading: loadingTransacoes } = useTransacoes();
  const { itensMercado, loading: loadingItens } = useItensMercado();
  const { dividas, loading: loadingDividas } = useDividas();
  const { veiculos, loading: loadingVeiculos } = useVeiculos();
  const { tiposManutencao, loading: loadingTiposManutencao } = useTiposManutencao();
  const { manutencoesPendentes, loading: loadingManutencoes } = useManutencoesPendentes(veiculos || [], tiposManutencao || []);
  const { profile, user } = useProfile();
  const { subscriptionData, loading: loadingSubscription } = useSubscription();
  const { lembretes, loading: loadingLembretes } = useLembretes();

  // Verificar se houve sucesso no pagamento
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      toast({
        title: "Pagamento realizado com sucesso!",
        description:
          "Sua assinatura foi ativada. Aguarde alguns segundos para atualizacao.",
        duration: 5000,
      });
      // Limpar o parametro da URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams, toast]);

  // Usar apenas um veiculo para as manutencoes se existir
  const primeiroVeiculo = veiculos && veiculos.length > 0 ? veiculos[0] : null;

  // Obter data de inicio baseada no periodo selecionado
  const getDataInicio = () => {
    switch (selectedPeriod) {
      case "semana":
        return getPrimeiroDiaSemana();
      case "mes":
        return getPrimeiroDiaMes();
      case "ano":
        return getPrimeiroDiaAno();
      default:
        return getPrimeiroDiaMes();
    }
  };

  const dataInicio = getDataInicio();
  const dataAtual = getDataAtual();

  // Filtrar transacoes do periodo
  const transacoesPeriodo = useMemo(() => {
    if (!transacoes) return [];
    
    // Para o período "mes", filtrar pelo mês completo
    if (selectedPeriod === "mes") {
      const now = new Date();
      const anoAtual = now.getFullYear();
      const mesAtual = now.getMonth() + 1;
      
      return transacoes.filter((transacao) => {
        // Extrair ano e mês da string de data (formato: YYYY-MM-DD)
        const [anoStr, mesStr] = transacao.data.split('T')[0].split('-');
        const anoTransacao = parseInt(anoStr);
        const mesTransacao = parseInt(mesStr);
        
        return anoTransacao === anoAtual && mesTransacao === mesAtual;
      });
    }
    
    // Para o período "semana", filtrar pela semana atual
    if (selectedPeriod === "semana") {
      const now = new Date();
      const primeiroDiaSemana = new Date(now.setDate(now.getDate() - now.getDay()));
      const ultimoDiaSemana = new Date(primeiroDiaSemana);
      ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6);
      
      // Formatando as datas para comparação string
      const primeiroDiaStr = primeiroDiaSemana.toISOString().split('T')[0];
      const ultimoDiaStr = ultimoDiaSemana.toISOString().split('T')[0];
      
      return transacoes.filter((transacao) => {
        const dataTransacao = transacao.data.split('T')[0];
        return dataTransacao >= primeiroDiaStr && dataTransacao <= ultimoDiaStr;
      });
    }
    
    // Para o período "ano", filtrar pelo ano atual
    if (selectedPeriod === "ano") {
      const now = new Date();
      const anoAtual = now.getFullYear();
      
      return transacoes.filter((transacao) => {
        const [anoStr] = transacao.data.split('T')[0].split('-');
        const anoTransacao = parseInt(anoStr);
        
        return anoTransacao === anoAtual;
      });
    }
    
    // Fallback para outros períodos
    return transacoes.filter((transacao) =>
      compararDatas(transacao.data, dataInicio)
    );
  }, [transacoes, dataInicio, selectedPeriod]);

  // Calcular receitas do período selecionado
  const receitasPeriodo = useMemo(() => {
    if (!transacoesPeriodo) return 0;
    
    return transacoesPeriodo
      .filter((transacao) => transacao.tipo === "receita")
      .reduce((acc, t) => acc + t.valor, 0);
  }, [transacoesPeriodo]);

  // Calcular despesas do período selecionado
  const despesasPeriodo = useMemo(() => {
    if (!transacoesPeriodo) return 0;
    
    return transacoesPeriodo
      .filter((transacao) => transacao.tipo === "despesa")
      .reduce((acc, t) => acc + t.valor, 0);
  }, [transacoesPeriodo]);

  // Saldo baseado no período selecionado
  const saldoPeriodo = receitasPeriodo - despesasPeriodo;

  // Funcao para obter icone da categoria
  const getCategoryIcon = (categoria: string) => {
    const icons: { [key: string]: any } = {
      Moradia: Home,
      Transporte: Car,
      Salario: DollarSign,
      Freelance: DollarSign,
      Investimentos: Investment,
      Alimentacao: Utensils,
      Lazer: Package,
      Saude: AlertTriangle,
    };
    return icons[categoria] || Package;
  };

  // Funcao para obter cor da categoria baseada na cor real da categoria
  const getCategoryColor = (categoria: string) => {
    const colors: { [key: string]: string } = {
      Moradia: "text-blue-600",
      Transporte: "text-green-600",
      Salario: "text-emerald-600",
      Freelance: "text-purple-600",
      Investimentos: "text-orange-600",
      Alimentacao: "text-red-600",
      Lazer: "text-pink-600",
      Saude: "text-yellow-600",
    };
    return colors[categoria] || "text-gray-600";
  };

  // Calculos adicionais
  const totalTransacoes = transacoesPeriodo.length;
  const mediaGastosDiarios = despesasPeriodo / 30;

  // Itens com estoque baixo
  const itensEstoqueBaixo = itensMercado?.filter((item) => item.quantidade <= 2) || [];

  // Dividas vencidas
  const dividasVencidas = dividas?.filter((divida) => {
    if (!divida.data_vencimento) return false;
    return compararDatas(dataAtual, divida.data_vencimento) && !divida.pago;
  }) || [];

  const totalDividasVencidas = dividasVencidas.reduce((acc, divida) => acc + divida.valor_parcela, 0);

  // Preparar transacoes para exibicao (ultimas 5)
  const transacoesRecentes = useMemo(() => {
    if (!transacoesPeriodo) return [];
    
    return transacoesPeriodo
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5)
      .map((transacao) => {
        const Icon = getCategoryIcon(transacao.categoria);
        const colorClass = getCategoryColor(transacao.categoria);
        
        return {
          ...transacao,
          icon: Icon,
          colorClass,
          valorFormatado: transacao.valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }),
          dataFormatada: formatarData(transacao.data),
          name: profile?.name || "Usuario",
        };
      });
  }, [transacoesPeriodo, profile]);

  // Funcao para obter o nome do periodo
  const getPeriodName = () => {
    switch (selectedPeriod) {
      case "semana":
        return "Semana atual";
      case "mes":
        return "Mes atual";
      case "ano":
        return "Ano atual";
      default:
        return "Periodo atual";
    }
  };

  const statsCards = [
    {
      title: "Receitas do periodo",
      value: receitasPeriodo.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Despesas do periodo",
      value: despesasPeriodo.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      icon: TrendingDown,
      color: "text-red-600",
    },
    {
      title: "Saldo do periodo",
      value: saldoPeriodo.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      icon: DollarSign,
      color: saldoPeriodo >= 0 ? "text-green-600" : "text-red-600",
    },
  ];

  // Filtrar lembretes pendentes
  const lembretesPendentes = useMemo(() => {
    if (!lembretes) return [];
    return lembretes
      .filter((lembrete) => !lembrete.concluido)
      .sort((a, b) => new Date(a.data_lembrete).getTime() - new Date(b.data_lembrete).getTime())
      .slice(0, 3);
  }, [lembretes]);

  if (loadingTransacoes || loadingItens || loadingDividas || loadingVeiculos || loadingManutencoes || loadingSubscription || loadingLembretes) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <TrialStatusBanner />
        <BasicAccessBanner />

        {!subscriptionData.effective_subscription && (
          <div className="mb-6 md:mb-8">
            <SubscriptionStatus />
          </div>
        )}

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Ola, {profile?.name || user?.email?.split('@')[0] || 'Usuário'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Bem-vindo ao seu painel financeiro
          </p>
        </div>

        <div className="mb-6 md:mb-8">
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="semana" className="text-sm">
                Semana
              </TabsTrigger>
              <TabsTrigger value="mes" className="text-sm">
                Mes
              </TabsTrigger>
              <TabsTrigger value="ano" className="text-sm">
                Ano
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedPeriod}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                {statsCards.map((stat, index) => (
                  <Card key={index} className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                          {stat.title}
                        </p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {stat.value}
                        </p>
                        {stat.badge && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {stat.badge}
                          </span>
                        )}
                      </div>
                      <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Alertas de Estoque Baixo */}
              {itensEstoqueBaixo.length > 0 && (
                <Card className="p-4 md:p-6 mb-6 md:mb-8 border-orange-200 bg-orange-50">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-orange-800 mb-1">
                        Estoque Baixo
                      </h3>
                      <p className="text-sm text-orange-700 mb-3">
                        {itensEstoqueBaixo.length} item(ns) com estoque baixo
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {itensEstoqueBaixo.slice(0, 3).map((item) => (
                          <span
                            key={item.id}
                            className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full"
                          >
                            {item.nome} ({item.quantidade})
                          </span>
                        ))}
                        {itensEstoqueBaixo.length > 3 && (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                            +{itensEstoqueBaixo.length - 3} mais
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 text-orange-700 border-orange-300 hover:bg-orange-100"
                        onClick={() => navigate("/mercado")}
                      >
                        Ver Lista de Mercado
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Segunda linha de cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">{/* Dividas Vencidas */}
                <Card className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-red-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Dividas Vencidas
                      </h3>
                    </div>
                  </div>
                  
                  {dividasVencidas.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        R$ {totalDividasVencidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} &bull; {dividasVencidas.length} divida
                        {dividasVencidas.length > 1 ? "s" : ""}
                      </p>
                      <div className="space-y-2">
                        {dividasVencidas.slice(0, 3).map((divida) => (
                          <div key={divida.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{divida.descricao}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                Venceu em {formatarData(divida.data_vencimento)}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-red-600">
                              R$ {divida.valor_parcela.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => navigate("/dividas")}
                      >
                        Gerenciar Dividas
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma divida vencida</p>
                    </div>
                  )}
                </Card>

                {/* Proximos Lembretes */}
                <Card className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Proximos Lembretes
                      </h3>
                    </div>
                  </div>
                  
                  {lembretesPendentes.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {lembretesPendentes.length} lembrete{lembretesPendentes.length > 1 ? "s" : ""} pendente{lembretesPendentes.length > 1 ? "s" : ""}
                      </p>
                      <div className="space-y-2">
                        {lembretesPendentes.map((lembrete) => {
                          // Criar data e hora completas no fuso horário local para evitar problemas de timezone
                          const dateTimeParts = lembrete.data_lembrete.split('T');
                          const dateParts = dateTimeParts[0].split('-');
                          const timeParts = dateTimeParts[1] ? dateTimeParts[1].split(':') : ['00', '00'];
                          
                          const dataLembrete = new Date(
                            parseInt(dateParts[0]), 
                            parseInt(dateParts[1]) - 1, 
                            parseInt(dateParts[2]),
                            parseInt(timeParts[0]),
                            parseInt(timeParts[1])
                          );
                          
                          const hoje = new Date();
                          const isHoje = dataLembrete.toDateString() === hoje.toDateString();
                          const isProximo = dataLembrete.getTime() - hoje.getTime() <= 3 * 24 * 60 * 60 * 1000;
                          
                          return (
                            <div key={lembrete.id} className="flex justify-between items-center p-2 bg-blue-50 dark:bg-transparent rounded">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lembrete.titulo}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatarData(lembrete.data_lembrete)} às {format(dataLembrete, "HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                isHoje 
                                  ? "bg-red-100 text-red-800" 
                                  : isProximo 
                                    ? "bg-yellow-100 text-yellow-800" 
                                    : "bg-gray-100 text-gray-800"
                              }`}>
                                {isHoje ? "Hoje" : isProximo ? "Proximo" : "Pendente"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => navigate("/lembretes")}
                      >
                        Ver Todos os Lembretes
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum lembrete pendente</p>
                    </div>
                  )}
                </Card>

                {/* Meus Veiculos */}
                <Card className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Car className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Meus Veiculos
            </h3>
                    </div>
                  </div>
                  
                  {loadingVeiculos ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Carregando veiculos...</p>
                  ) : veiculos && veiculos.length > 0 ? (
                    <div className="space-y-3">
                      {veiculos.slice(0, 2).map((veiculo) => (
                        <div key={veiculo.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {veiculo.marca} {veiculo.modelo} ({veiculo.ano})
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                {veiculo.ano} &bull; {veiculo.quilometragem.toLocaleString()} km
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate("/veiculos")}
                      >
                        Gerenciar Veiculos
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum veiculo cadastrado ainda.</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Transacoes Recentes - Movido para o final */}
              <Card className="p-4 md:p-6 mb-6 md:mb-8 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Últimas Transações - {selectedPeriod === 'Mes' ? 'Mês' : selectedPeriod}
            </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/transacoes")}
                  >
                    Ver Todas
                  </Button>
                </div>

                {transacoesRecentes.length > 0 ? (
                  <div className="space-y-3">
                    {transacoesRecentes.map((transacao) => (
                      <div
                        key={transacao.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-transparent rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full bg-white dark:bg-gray-800 ${transacao.colorClass}`}>
                            <transacao.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {transacao.descricao}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>{transacao.categoria}</span>
                              <span>&bull;</span>
                              <span>{transacao.dataFormatada}</span>
                              <CreatedByBadge
                                userId={transacao.user_id}
                                createdBySharedUserId={transacao.created_by_shared_user_id}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${
                              transacao.tipo === "receita"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transacao.tipo === "receita" ? "+" : "-"}
                            {transacao.valorFormatado}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        Nenhuma transacao encontrada para o periodo selecionado.
                      </p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

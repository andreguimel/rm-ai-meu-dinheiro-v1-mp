import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";

interface FinancialMetricsProps {
  currentPeriodData: {
    receitas: number;
    despesas: number;
    saldo: number;
  };
  previousPeriodData: {
    receitas: number;
    despesas: number;
    saldo: number;
  };
  period: string;
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({
  currentPeriodData,
  previousPeriodData,
  period,
}) => {
  // Calcular taxas de crescimento
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const receitasGrowth = calculateGrowthRate(
    currentPeriodData.receitas,
    previousPeriodData.receitas
  );
  const despesasGrowth = calculateGrowthRate(
    currentPeriodData.despesas,
    previousPeriodData.despesas
  );
  const saldoGrowth = calculateGrowthRate(
    currentPeriodData.saldo,
    previousPeriodData.saldo
  );

  // Calcular score de saúde financeira (0-100)
  const calculateHealthScore = () => {
    let score = 50; // Base score

    // Saldo positivo (+20 pontos)
    if (currentPeriodData.saldo > 0) score += 20;

    // Receitas crescendo (+15 pontos)
    if (receitasGrowth > 0) score += 15;

    // Despesas controladas (+10 pontos se crescimento < 5%)
    if (despesasGrowth < 5) score += 10;

    // Ratio receita/despesa saudável (+5 pontos se > 1.2)
    const ratio =
      currentPeriodData.receitas / (currentPeriodData.despesas || 1);
    if (ratio > 1.2) score += 5;

    return Math.min(100, Math.max(0, score));
  };

  const healthScore = calculateHealthScore();

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Boa";
    if (score >= 40) return "Regular";
    return "Precisa Atenção";
  };

  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? "+" : "";
    return `${sign}${growth.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  const getGrowthColor = (growth: number, isExpense = false) => {
    if (isExpense) {
      return growth <= 0 ? "text-green-600" : "text-red-600";
    }
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {/* Score de Saúde Financeira */}
      <Card className={`border-2 ${getHealthColor(healthScore)}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Saúde Financeira
          </CardTitle>
          <Activity className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{healthScore}/100</div>
          <Badge variant="outline" className="mt-1">
            {getHealthLabel(healthScore)}
          </Badge>
        </CardContent>
      </Card>

      {/* Crescimento de Receitas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Crescimento Receitas
          </CardTitle>
          {React.createElement(getGrowthIcon(receitasGrowth), {
            className: `h-4 w-4 ${getGrowthColor(receitasGrowth)}`,
          })}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${getGrowthColor(receitasGrowth)}`}
          >
            {formatGrowth(receitasGrowth)}
          </div>
          <p className="text-xs text-muted-foreground">vs {period} anterior</p>
        </CardContent>
      </Card>

      {/* Controle de Despesas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Controle Despesas
          </CardTitle>
          {React.createElement(getGrowthIcon(despesasGrowth), {
            className: `h-4 w-4 ${getGrowthColor(despesasGrowth, true)}`,
          })}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${getGrowthColor(
              despesasGrowth,
              true
            )}`}
          >
            {formatGrowth(despesasGrowth)}
          </div>
          <p className="text-xs text-muted-foreground">vs {period} anterior</p>
        </CardContent>
      </Card>

      {/* Evolução do Saldo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Evolução Saldo</CardTitle>
          <Target className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getGrowthColor(saldoGrowth)}`}>
            {formatGrowth(saldoGrowth)}
          </div>
          <p className="text-xs text-muted-foreground">vs {period} anterior</p>
        </CardContent>
      </Card>
    </div>
  );
};

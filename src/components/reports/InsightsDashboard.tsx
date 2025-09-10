import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
} from "lucide-react";

interface Transaction {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  tipo: "receita" | "despesa";
}

interface InsightsDashboardProps {
  transactions: Transaction[];
  period: string;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({
  transactions,
  period,
}) => {
  // Análise de padrões de gastos
  const analyzeSpendingPatterns = () => {
    const insights = [];

    // Análise por dia da semana
    const daySpending = transactions
      .filter((t) => t.tipo === "despesa")
      .reduce((acc, t) => {
        const date = new Date(t.data);
        const dayName = date.toLocaleDateString("pt-BR", { weekday: "long" });
        acc[dayName] = (acc[dayName] || 0) + t.valor;
        return acc;
      }, {} as Record<string, number>);

    const maxSpendingDay = Object.entries(daySpending).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (maxSpendingDay) {
      insights.push({
        type: "pattern",
        icon: Calendar,
        title: "Padrão de Gastos",
        description: `Você gasta mais às ${
          maxSpendingDay[0]
        }s (R$ ${maxSpendingDay[1].toLocaleString("pt-BR")})`,
        color: "blue",
      });
    }

    // Análise de gastos anômalos (acima de 2x a média)
    const expenses = transactions.filter((t) => t.tipo === "despesa");
    const avgExpense =
      expenses.reduce((sum, t) => sum + t.valor, 0) / expenses.length;
    const anomalousExpenses = expenses.filter((t) => t.valor > avgExpense * 2);

    if (anomalousExpenses.length > 0) {
      insights.push({
        type: "alert",
        icon: AlertTriangle,
        title: "Gastos Anômalos",
        description: `${anomalousExpenses.length} transação(ões) acima da média detectada(s)`,
        color: "red",
      });
    }

    // Top categoria de gastos
    const categorySpending = transactions
      .filter((t) => t.tipo === "despesa")
      .reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
        return acc;
      }, {} as Record<string, number>);

    const topCategory = Object.entries(categorySpending).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (topCategory) {
      insights.push({
        type: "info",
        icon: DollarSign,
        title: "Maior Gasto",
        description: `${topCategory[0]}: R$ ${topCategory[1].toLocaleString(
          "pt-BR"
        )}`,
        color: "orange",
      });
    }

    return insights;
  };

  // Sugestões de economia
  const generateSavingSuggestions = () => {
    const suggestions = [];

    // Análise de frequência de gastos pequenos
    const smallExpenses = transactions.filter(
      (t) => t.tipo === "despesa" && t.valor < 50
    ).length;

    if (smallExpenses > 10) {
      suggestions.push({
        icon: Lightbulb,
        title: "Gastos Pequenos Frequentes",
        description: `Você tem ${smallExpenses} gastos pequenos. Considere agrupar compras para economizar.`,
        potential: "R$ 50-100/mês",
      });
    }

    // Análise de gastos em categorias específicas
    const categoryTotals = transactions
      .filter((t) => t.tipo === "despesa")
      .reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
        return acc;
      }, {} as Record<string, number>);

    const totalExpenses = Object.values(categoryTotals).reduce(
      (sum, val) => sum + val,
      0
    );

    // Sugestão se gastos com alimentação > 30%
    const foodSpending =
      (categoryTotals["Alimentação"] || 0) +
      (categoryTotals["Restaurante"] || 0);
    if (foodSpending > totalExpenses * 0.3) {
      suggestions.push({
        icon: Target,
        title: "Gastos com Alimentação",
        description:
          "Seus gastos com alimentação estão altos. Considere cozinhar mais em casa.",
        potential: "R$ 200-400/mês",
      });
    }

    return suggestions;
  };

  const insights = analyzeSpendingPatterns();
  const suggestions = generateSavingSuggestions();

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "text-blue-600 bg-blue-50 border-blue-200",
      red: "text-red-600 bg-red-50 border-red-200",
      orange: "text-orange-600 bg-orange-50 border-orange-200",
      green: "text-green-600 bg-green-50 border-green-200",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* Insights Automáticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Insights Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <Alert key={index} className={getColorClasses(insight.color)}>
                <insight.icon className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">{insight.title}</div>
                  <div className="text-sm mt-1">{insight.description}</div>
                </AlertDescription>
              </Alert>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Adicione mais transações para ver insights personalizados.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sugestões de Economia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Sugestões de Economia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg bg-green-50 border-green-200"
              >
                <div className="flex items-start gap-3">
                  <suggestion.icon className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-green-800">
                      {suggestion.title}
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      {suggestion.description}
                    </div>
                    <Badge
                      variant="outline"
                      className="mt-2 text-green-600 border-green-300"
                    >
                      Economia potencial: {suggestion.potential}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Continue registrando suas transações para receber sugestões
              personalizadas.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, BarChart3 } from "lucide-react";

interface Transaction {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  tipo: "receita" | "despesa";
}

interface SpendingHeatmapProps {
  transactions: Transaction[];
}

export const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({
  transactions,
}) => {
  const [viewMode, setViewMode] = useState<"day" | "hour">("day");

  // Processar dados por dia da semana
  const processDayData = () => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dayData = days.map((day) => ({ day, value: 0 }));

    transactions
      .filter((t) => t.tipo === "despesa")
      .forEach((transaction) => {
        const date = new Date(transaction.data);
        const dayIndex = date.getDay();
        dayData[dayIndex].value += transaction.valor;
      });

    return dayData;
  };

  // Processar dados por período do dia (manhã, tarde, noite)
  const processHourData = () => {
    const periods = [
      { name: "Madrugada", start: 0, end: 5, value: 0 },
      { name: "Manhã", start: 6, end: 11, value: 0 },
      { name: "Tarde", start: 12, end: 17, value: 0 },
      { name: "Noite", start: 18, end: 23, value: 0 },
    ];

    transactions
      .filter((t) => t.tipo === "despesa")
      .forEach((transaction) => {
        const date = new Date(transaction.data);
        const hour = date.getHours();

        const period = periods.find((p) => hour >= p.start && hour <= p.end);
        if (period) {
          period.value += transaction.valor;
        }
      });

    return periods;
  };

  const dayData = processDayData();
  const hourData = processHourData();
  const currentData = viewMode === "day" ? dayData : hourData;

  // Encontrar valor máximo para normalização
  const maxValue = Math.max(...currentData.map((item) => item.value));

  // Função para obter intensidade da cor
  const getIntensity = (value: number) => {
    if (maxValue === 0) return 0;
    return value / maxValue;
  };

  // Função para obter cor baseada na intensidade
  const getColor = (intensity: number) => {
    if (intensity === 0) return "bg-gray-100 border-gray-200";
    if (intensity < 0.2) return "bg-orange-100 border-orange-200";
    if (intensity < 0.4) return "bg-orange-200 border-orange-300";
    if (intensity < 0.6) return "bg-orange-300 border-orange-400";
    if (intensity < 0.8) return "bg-orange-400 border-orange-500";
    return "bg-orange-500 border-orange-600";
  };

  // Estatísticas
  const totalGastos = currentData.reduce((sum, item) => sum + item.value, 0);
  const periodosAtivos = currentData.filter((item) => item.value > 0).length;
  const maiorPeriodo = currentData.reduce(
    (max, item) => (item.value > max.value ? item : max),
    currentData[0]
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            Padrões de Gastos
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("day")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Por Dia
            </Button>
            <Button
              variant={viewMode === "hour" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("hour")}
            >
              <Clock className="h-4 w-4 mr-1" />
              Por Período
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Legenda */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Menos gastos</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
              <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
              <div className="w-3 h-3 bg-orange-200 border border-orange-300 rounded"></div>
              <div className="w-3 h-3 bg-orange-300 border border-orange-400 rounded"></div>
              <div className="w-3 h-3 bg-orange-400 border border-orange-500 rounded"></div>
              <div className="w-3 h-3 bg-orange-500 border border-orange-600 rounded"></div>
            </div>
            <span className="text-muted-foreground">Mais gastos</span>
          </div>

          {/* Heatmap Compacto */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {currentData.map((item, index) => {
              const intensity = getIntensity(item.value);
              const colorClass = getColor(intensity);
              const displayName = viewMode === "day" ? item.day : item.name;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer ${colorClass}`}
                  title={`${displayName}: R$ ${item.value.toLocaleString(
                    "pt-BR"
                  )}`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {displayName}
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      R$ {item.value.toLocaleString("pt-BR")}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {totalGastos > 0
                        ? Math.round((item.value / totalGastos) * 100)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Estatísticas Resumidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {periodosAtivos}
              </div>
              <div className="text-xs text-muted-foreground">
                {viewMode === "day" ? "Dias" : "Períodos"} com gastos
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                R$ {maiorPeriodo.value.toLocaleString("pt-BR")}
              </div>
              <div className="text-xs text-muted-foreground">Maior gasto</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {maiorPeriodo.day || maiorPeriodo.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {viewMode === "day" ? "Dia" : "Período"} preferido
              </div>
            </div>
          </div>

          {/* Insights Rápidos */}
          <div className="bg-blue-50 dark:bg-transparent border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Insight</h4>
            <p className="text-sm text-blue-700">
              {viewMode === "day"
                ? `Você gasta mais ${
                    maiorPeriodo.value > 0
                      ? `às ${maiorPeriodo.day}s`
                      : "nos fins de semana"
                  } 
                   (${Math.round(
                     (maiorPeriodo.value / totalGastos) * 100
                   )}% dos gastos)`
                : `Seus maiores gastos acontecem ${
                    maiorPeriodo.value > 0
                      ? `de ${maiorPeriodo.name.toLowerCase()}`
                      : "durante o dia"
                  } 
                   (${Math.round(
                     (maiorPeriodo.value / totalGastos) * 100
                   )}% dos gastos)`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeBarChart } from "@/components/charts/NativeBarChart";
import { NativeLineChart } from "@/components/charts/NativeLineChart";
import { NativePieChart } from "@/components/charts/NativePieChart";
import { TrendingUp } from "lucide-react";

interface ChartData {
  periodo: string;
  receitas: number;
  despesas: number;
  saldo: number;
  saldoAcumulado?: number;
  meta?: number;
}

interface InteractiveChartsProps {
  data: ChartData[];
  period: string;
}

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  data,
  period,
}) => {
  // Calcular saldo acumulado
  const finalData = data.map((item, index) => {
    const saldoAcumulado = data
      .slice(0, index + 1)
      .reduce((acc, curr) => acc + curr.saldo, 0);

    return {
      ...item,
      saldoAcumulado,
    };
  });

  // Função simples para formatar valores
  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR")}`;
  };

  // Estatísticas
  const totalReceitas = finalData.reduce((acc, curr) => acc + curr.receitas, 0);
  const totalDespesas = finalData.reduce((acc, curr) => acc + curr.despesas, 0);
  const saldoFinal = totalReceitas - totalDespesas;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Receitas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalReceitas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalDespesas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Final</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                saldoFinal >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(saldoFinal)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receitas e Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <NativeBarChart
              data={[
                ...finalData.map(item => ({
                  name: item.periodo,
                  value: item.receitas,
                  color: '#10b981'
                })),
                ...finalData.map(item => ({
                  name: item.periodo,
                  value: item.despesas,
                  color: '#ef4444'
                }))
              ]}
              title="Receitas vs Despesas"
              height={300}
              formatValue={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saldo Acumulado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <NativeLineChart
              data={finalData.map(item => ({
                name: item.periodo,
                value: item.saldo
              }))}
              title="Evolução do Saldo"
              height={300}
              color="#3b82f6"
              formatValue={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

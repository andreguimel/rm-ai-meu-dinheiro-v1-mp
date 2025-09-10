import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={finalData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `R$ ${value.toLocaleString("pt-BR")}`
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    `R$ ${value.toLocaleString("pt-BR")}`,
                    undefined,
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="receitas"
                  name="Receitas"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="despesas"
                  name="Despesas"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saldo Acumulado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={finalData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `R$ ${value.toLocaleString("pt-BR")}`
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    `R$ ${value.toLocaleString("pt-BR")}`,
                    undefined,
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="saldoAcumulado"
                  name="Saldo Acumulado"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

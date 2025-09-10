import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Brush,
} from "recharts";
import { ZoomIn, ZoomOut, RotateCcw, TrendingUp } from "lucide-react";

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
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [showMovingAverage, setShowMovingAverage] = useState(false);

  // Calcular saldo acumulado
  const dataWithAccumulated = data.map((item, index) => {
    const saldoAcumulado = data
      .slice(0, index + 1)
      .reduce((acc, curr) => acc + curr.saldo, 0);

    return {
      ...item,
      saldoAcumulado,
    };
  });

  // Calcular média móvel (7 períodos)
  const dataWithMovingAverage = dataWithAccumulated.map((item, index) => {
    const start = Math.max(0, index - 6);
    const slice = dataWithAccumulated.slice(start, index + 1);
    const movingAverage =
      slice.reduce((acc, curr) => acc + curr.saldo, 0) / slice.length;

    return {
      ...item,
      mediaMovel: movingAverage,
    };
  });

  const finalData = dataWithMovingAverage;

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`Período: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: R$ ${entry.value?.toLocaleString("pt-BR")}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Função para resetar zoom
  const resetZoom = () => {
    setZoomDomain(null);
  };

  // Função para zoom in
  const zoomIn = () => {
    if (finalData.length > 10) {
      const start = Math.floor(finalData.length * 0.25);
      const end = Math.floor(finalData.length * 0.75);
      setZoomDomain([start, end]);
    }
  };

  // Função para zoom out
  const zoomOut = () => {
    setZoomDomain(null);
  };

  return (
    <div className="space-y-4">
      {/* Gráfico Combinado Interativo */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Análise Financeira Interativa - {period}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMovingAverage(!showMovingAverage)}
              >
                {showMovingAverage ? "Ocultar" : "Mostrar"} Média Móvel
              </Button>
              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetZoom}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={finalData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 12 }}
                  domain={zoomDomain || ["dataMin", "dataMax"]}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} width={80} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {/* Linha de referência no zero */}
                <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />

                {/* Barras de receitas e despesas */}
                <Bar
                  yAxisId="left"
                  dataKey="receitas"
                  fill="#22c55e"
                  name="Receitas"
                  opacity={0.8}
                />
                <Bar
                  yAxisId="left"
                  dataKey="despesas"
                  fill="#ef4444"
                  name="Despesas"
                  opacity={0.8}
                />

                {/* Linha do saldo */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="saldo"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Saldo"
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                />

                {/* Linha do saldo acumulado */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="saldoAcumulado"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Saldo Acumulado"
                  dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
                />

                {/* Média móvel (condicional) */}
                {showMovingAverage && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="mediaMovel"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    name="Média Móvel (7 períodos)"
                    dot={false}
                  />
                )}

                {/* Brush para navegação */}
                <Brush dataKey="periodo" height={30} stroke="#8884d8" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas do Gráfico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                R${" "}
                {finalData[
                  finalData.length - 1
                ]?.saldoAcumulado?.toLocaleString("pt-BR") || "0"}
              </div>
              <div className="text-xs text-muted-foreground">
                Saldo Acumulado
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                R${" "}
                {Math.max(...finalData.map((d) => d.receitas)).toLocaleString(
                  "pt-BR"
                )}
              </div>
              <div className="text-xs text-muted-foreground">Maior Receita</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                R${" "}
                {Math.max(...finalData.map((d) => d.despesas)).toLocaleString(
                  "pt-BR"
                )}
              </div>
              <div className="text-xs text-muted-foreground">Maior Despesa</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {finalData.filter((d) => d.saldo > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">
                Períodos Positivos
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrialAnalyticsData } from "@/hooks/useTrialAnalytics";
import { useToast } from "@/hooks/use-toast";
import { NativeBarChart } from "@/components/charts/NativeBarChart";
import { NativeLineChart } from "@/components/charts/NativeLineChart";
import { NativePieChart } from "@/components/charts/NativePieChart";
import {
  Calendar,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
} from "lucide-react";

interface TrialAnalyticsData {
  date: string;
  trials_created: number;
  trials_accessed: number;
  trials_expired: number;
  trials_converted: number;
  trial_errors: number;
  conversion_rate: number;
}

interface ConversionFunnelData {
  total_trials_created: number;
  total_trials_accessed: number;
  total_trials_converted: number;
  access_rate: number;
  conversion_rate: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export const TrialAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<TrialAnalyticsData[]>([]);
  const [funnelData, setFunnelData] = useState<ConversionFunnelData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30"); // days

  const { getTrialAnalytics, getTrialConversionFunnel } =
    useTrialAnalyticsData();
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const [analyticsResult, funnelResult] = await Promise.all([
        getTrialAnalytics(startDate.toISOString().split("T")[0]),
        getTrialConversionFunnel(startDate.toISOString().split("T")[0]),
      ]);

      if (analyticsResult.success && analyticsResult.data) {
        setAnalyticsData(analyticsResult.data);
      } else {
        throw new Error(analyticsResult.error || "Failed to fetch analytics");
      }

      if (funnelResult.success && funnelResult.data) {
        setFunnelData(funnelResult.data);
      } else {
        throw new Error(funnelResult.error || "Failed to fetch funnel data");
      }
    } catch (error) {
      console.error("Error fetching trial analytics:", error);
      toast({
        title: "Erro ao carregar analytics",
        description:
          "Não foi possível carregar os dados de analytics do período de teste.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const totalTrials = analyticsData.reduce(
    (sum, day) => sum + day.trials_created,
    0
  );
  const totalConversions = analyticsData.reduce(
    (sum, day) => sum + day.trials_converted,
    0
  );
  const totalErrors = analyticsData.reduce(
    (sum, day) => sum + day.trial_errors,
    0
  );
  const avgConversionRate =
    totalTrials > 0 ? (totalConversions / totalTrials) * 100 : 0;

  const pieData = [
    { name: "Convertidos", value: totalConversions, color: "#00C49F" },
    {
      name: "Expirados",
      value: analyticsData.reduce((sum, day) => sum + day.trials_expired, 0),
      color: "#FF8042",
    },
    {
      name: "Ativos",
      value:
        totalTrials -
        totalConversions -
        analyticsData.reduce((sum, day) => sum + day.trials_expired, 0),
      color: "#0088FE",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics do Período de Teste</h2>
          <p className="text-muted-foreground">
            Acompanhe o desempenho e conversão dos períodos de teste
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === "7" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("7")}
          >
            7 dias
          </Button>
          <Button
            variant={dateRange === "30" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("30")}
          >
            30 dias
          </Button>
          <Button
            variant={dateRange === "90" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("90")}
          >
            90 dias
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Trials Criados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrials}</div>
            <p className="text-xs text-muted-foreground">
              Últimos {dateRange} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Conversão
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgConversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {totalConversions} de {totalTrials} trials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              Trials convertidos em assinaturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalErrors}</div>
            <p className="text-xs text-muted-foreground">
              Erros relacionados a trials
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="funnel">Funil de Conversão</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade de Trials ao Longo do Tempo</CardTitle>
              <CardDescription>
                Acompanhe a criação, acesso e conversão de trials diariamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NativeLineChart
                data={analyticsData.map(item => ({
                  name: new Date(item.date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  }),
                  trials_created: item.trials_created,
                  trials_accessed: item.trials_accessed,
                  trials_converted: item.trials_converted
                }))}
                title="Atividade de Trials ao Longo do Tempo"
                height={400}
                color="#0088FE"
                formatValue={(value) => `${value} trials`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          {funnelData && (
            <Card>
              <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>
                  Visualize o caminho dos usuários desde a criação do trial até
                  a conversão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {funnelData.total_trials_created}
                      </div>
                      <div className="text-sm text-blue-600">
                        Trials Criados
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {funnelData.total_trials_accessed}
                      </div>
                      <div className="text-sm text-green-600">
                        Trials Acessados
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {funnelData.access_rate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {funnelData.total_trials_converted}
                      </div>
                      <div className="text-sm text-yellow-600">Convertidos</div>
                      <Badge variant="secondary" className="mt-1">
                        {funnelData.conversion_rate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Status dos Trials</CardTitle>
              <CardDescription>
                Visualize a distribuição atual dos trials por status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NativePieChart
                data={pieData}
                title="Status dos Trials"
                size={300}
                showLegend={true}
                showLabels={true}
                formatValue={(value) => `${value} trials`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

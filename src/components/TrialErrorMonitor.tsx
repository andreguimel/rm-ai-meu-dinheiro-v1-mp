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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTrialAnalyticsData } from "@/hooks/useTrialAnalytics";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface TrialError {
  id: string;
  user_id: string;
  event_type: string;
  event_data: {
    error_type?: string;
    error_message?: string;
    user_email?: string;
    request_source?: string;
    [key: string]: any;
  };
  created_at: string;
}

interface ErrorSummary {
  error_type: string;
  count: number;
  latest_occurrence: string;
  affected_users: number;
}

export const TrialErrorMonitor: React.FC = () => {
  const [errors, setErrors] = useState<TrialError[]>([]);
  const [errorSummary, setErrorSummary] = useState<ErrorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { toast } = useToast();

  const fetchTrialErrors = async () => {
    try {
      setLoading(true);

      // Fetch recent trial errors (last 24 hours)
      const { data: errorData, error: errorFetchError } = await supabase
        .from("trial_events")
        .select("*")
        .eq("event_type", "trial_error")
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (errorFetchError) {
        throw errorFetchError;
      }

      setErrors(errorData || []);

      // Generate error summary
      const summary: { [key: string]: ErrorSummary } = {};

      (errorData || []).forEach((error) => {
        const errorType = error.event_data?.error_type || "unknown_error";

        if (!summary[errorType]) {
          summary[errorType] = {
            error_type: errorType,
            count: 0,
            latest_occurrence: error.created_at,
            affected_users: new Set<string>().size,
          };
        }

        summary[errorType].count++;
        if (
          new Date(error.created_at) >
          new Date(summary[errorType].latest_occurrence)
        ) {
          summary[errorType].latest_occurrence = error.created_at;
        }
      });

      // Count unique users per error type
      for (const errorType in summary) {
        const uniqueUsers = new Set(
          (errorData || [])
            .filter(
              (e) => (e.event_data?.error_type || "unknown_error") === errorType
            )
            .map((e) => e.user_id)
        );
        summary[errorType].affected_users = uniqueUsers.size;
      }

      setErrorSummary(Object.values(summary).sort((a, b) => b.count - a.count));
    } catch (error) {
      console.error("Error fetching trial errors:", error);
      toast({
        title: "Erro ao carregar monitoramento",
        description: "Não foi possível carregar os dados de erros dos trials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialErrors();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh) {
      interval = setInterval(fetchTrialErrors, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

  const getErrorSeverity = (errorType: string): "low" | "medium" | "high" => {
    if (
      errorType.includes("creation_failed") ||
      errorType.includes("function_error")
    ) {
      return "high";
    }
    if (
      errorType.includes("user_not_confirmed") ||
      errorType.includes("subscription_check_error")
    ) {
      return "medium";
    }
    return "low";
  };

  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Agora mesmo";
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalErrors = errors.length;
  const criticalErrors = errorSummary.filter(
    (e) => getErrorSeverity(e.error_type) === "high"
  ).length;
  const recentErrors = errors.filter(
    (e) => new Date(e.created_at) > new Date(Date.now() - 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            Monitoramento de Erros - Trials
          </h2>
          <p className="text-muted-foreground">
            Acompanhe erros relacionados ao sistema de período de teste
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrialErrors}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Auto-refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Erros (24h)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalErrors}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Erros Críticos
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {criticalErrors}
            </div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Erros Recentes (1h)
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentErrors}</div>
            <p className="text-xs text-muted-foreground">Última hora</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Erros por Tipo</CardTitle>
          <CardDescription>
            Tipos de erro mais frequentes e seu impacto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorSummary.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Nenhum erro encontrado</AlertTitle>
              <AlertDescription>
                Não foram encontrados erros relacionados a trials nas últimas 24
                horas.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {errorSummary.map((summary, index) => {
                const severity = getErrorSeverity(summary.error_type);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant={getSeverityColor(severity)}>
                        {severity.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="font-medium">{summary.error_type}</div>
                        <div className="text-sm text-muted-foreground">
                          {summary.affected_users} usuários afetados
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {summary.count} ocorrências
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTimeAgo(summary.latest_occurrence)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Erros Recentes</CardTitle>
          <CardDescription>
            Lista detalhada dos erros mais recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Nenhum erro recente</AlertTitle>
              <AlertDescription>
                Não há erros registrados nas últimas 24 horas.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {errors.slice(0, 10).map((error) => {
                const severity = getErrorSeverity(
                  error.event_data?.error_type || "unknown"
                );
                return (
                  <div key={error.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Badge
                          variant={getSeverityColor(severity)}
                          className="mt-1"
                        >
                          {error.event_data?.error_type || "unknown"}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium">
                            {error.event_data?.error_message ||
                              "Erro sem mensagem"}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <User className="h-3 w-3 inline mr-1" />
                            {error.event_data?.user_email || error.user_id}
                            {error.event_data?.request_source && (
                              <span className="ml-2">
                                • {error.event_data.request_source}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTimeAgo(error.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

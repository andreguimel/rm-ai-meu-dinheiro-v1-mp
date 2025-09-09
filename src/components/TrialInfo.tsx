import React from "react";
import { useSubscriptionDirect } from "@/hooks/useSubscriptionDirect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle } from "lucide-react";

export const TrialInfo: React.FC = () => {
  const { subscriptionData, loading, hasActiveTrial } = useSubscriptionDirect();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Período de Teste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">
              Carregando informações do trial...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se não há trial (nem ativo nem histórico), não mostrar o componente
  if (!subscriptionData.trial_data.trial_start) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = () => {
    if (hasActiveTrial) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">✅ Ativo</Badge>
      );
    } else {
      return <Badge variant="secondary">⏰ Expirado</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Período de Teste
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dias Restantes */}
        {hasActiveTrial && (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <Clock className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                {subscriptionData.trial_days_remaining} dias restantes
              </p>
              <p className="text-sm text-green-600">
                Aproveite todas as funcionalidades premium
              </p>
            </div>
          </div>
        )}

        {/* Informações de Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Data de Início
              </p>
              <p className="text-sm text-gray-600">
                {formatDate(subscriptionData.trial_data.trial_start)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Data de Término
              </p>
              <p className="text-sm text-gray-600">
                {formatDate(subscriptionData.trial_data.trial_end)}
              </p>
            </div>
          </div>
        </div>

        {/* Mensagem adicional se trial expirado */}
        {!hasActiveTrial && subscriptionData.trial_data.trial_end && (
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800">
              Seu período de teste expirou. Para continuar usando todas as
              funcionalidades, considere assinar um plano premium.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

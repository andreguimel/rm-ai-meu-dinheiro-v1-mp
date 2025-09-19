import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  Calendar,
  CreditCard,
  RefreshCw,
  Download,
  AlertCircle,
  Gift,
  Settings,
  Trash2,
  CalendarDays,
  XCircle,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string;
  receipt_url: string;
  payment_method_details: {
    type: string;
    card?: {
      brand: string;
      last4: string;
    };
  };
}

export const SubscriptionManagement = () => {
  const {
    subscriptionData,
    loading,
    checkSubscription,
    createCheckout,
    cancelSubscription,
  } = useSubscription();
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>(
    []
  );
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  useEffect(() => {
    if (subscriptionData.effective_subscription) {
      // loadPaymentHistory();
    }
  }, [subscriptionData.effective_subscription]);

  const loadPaymentHistory = async () => {
    setLoadingHistory(true);
    // const history = await getPaymentHistory();
    // setPaymentHistory(history);
    setLoadingHistory(false);
  };

  const handleCancelSubscription = async () => {
    setLoadingCancel(true);
    await cancelSubscription();
    setLoadingCancel(false);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), "dd 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "trialing":
        return "secondary";
      case "canceled":
        return "destructive";
      case "past_due":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa";
      case "trialing":
        return "Em Teste";
      case "canceled":
        return "Cancelada";
      case "past_due":
        return "Vencida";
      case "incomplete":
        return "Incompleta";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-4 w-64" />
        </CardContent>
      </Card>
    );
  }

  const {
    subscribed,
    subscription_tier,
    subscription_end,
    status,
    amount,
    currency,
    current_period_end,
    subscription_start,
    cancel_at_period_end,
    trial_end,
    trial_days_remaining,
    payment_method: rawPaymentMethod,
    last_payment_amount,
    last_payment_currency,
    last_payment_status,
    discount,
  } = subscriptionData;

  // If user is admin, show admin interface instead
  if (subscription_tier === "admin") {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <Settings className="h-12 w-12 text-blue-500 mx-auto mb-2" />
          <CardTitle className="text-xl">Acesso Administrativo</CardTitle>
          <CardDescription>
            Você tem acesso total ao sistema como administrador
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-blue-50 dark:bg-transparent border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
              <Crown className="h-4 w-4" />
              <span>Administrador do Sistema</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Acesso ilimitado a todas as funcionalidades
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>✅ Acesso completo ao dashboard</p>
            <p>✅ Todas as funcionalidades desbloqueadas</p>
            <p>✅ Sem limitações de tempo ou recursos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normaliza diferentes formatos que podem vir do backend:
  const paymentMethod = (() => {
    if (!rawPaymentMethod) return null;
    if ((rawPaymentMethod as any).card) {
      const c = (rawPaymentMethod as any).card;
      return {
        type: (rawPaymentMethod as any).type || "card",
        brand: c.brand || null,
        last4: c.last4 || c.last_four_digits || null,
        exp_month: c.exp_month || c.expiration_month || null,
        exp_year: c.exp_year || c.expiration_year || null,
      };
    }
    return {
      type: (rawPaymentMethod as any).type || "card",
      brand: (rawPaymentMethod as any).brand || null,
      last4:
        (rawPaymentMethod as any).last4 ||
        (rawPaymentMethod as any).last_four_digits ||
        null,
      exp_month: (rawPaymentMethod as any).exp_month || null,
      exp_year: (rawPaymentMethod as any).exp_year || null,
    };
  })();

  // helper para considerar vários status de sucesso (MercadoPago usa 'approved', 'authorized', etc.)
  const isSuccessStatus = (s: string | null | undefined) => {
    if (!s) return false;
    const normalized = s.toString().toLowerCase();
    return ["succeeded", "approved", "authorized", "paid"].includes(normalized);
  };

  // If not subscribed but has an active trial, show trial card
  const hasActiveTrial =
    !!trial_end && new Date(trial_end).getTime() > Date.now();

  // Calculate trial days remaining
  const calculateTrialDaysRemaining = (trialEndDate: string | null) => {
    if (!trialEndDate) return 0;
    const endDate = new Date(trialEndDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Use trial_days_remaining from backend if available, otherwise calculate client-side
  const trialDaysRemaining =
    trial_days_remaining !== null && trial_days_remaining !== undefined
      ? trial_days_remaining
      : calculateTrialDaysRemaining(trial_end);

  // Check if user has a real paid subscription (not just trial)
  const hasRealSubscription =
    subscribed &&
    (subscription_tier === "Premium" || subscription_tier === "admin") &&
    (last_payment_amount || amount) && // Has payment data
    (isSuccessStatus(last_payment_status) || isSuccessStatus(status)); // Has successful payment

  // Check if user is in trial (either marked as subscribed with Trial tier or has active trial)
  const isInTrial =
    subscribed &&
    subscription_tier === "Trial" &&
    hasActiveTrial &&
    trialDaysRemaining > 0;

  // Check if trial has expired
  const isTrialExpired =
    subscription_tier === "Trial" &&
    (!hasActiveTrial || trialDaysRemaining === 0);

  // If trial has expired, show upgrade message
  if (isTrialExpired) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <CardTitle className="text-xl">Período de Teste Expirado</CardTitle>
          <CardDescription>
            Seu teste gratuito de 7 dias expirou. Assine agora para continuar
            usando todos os recursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-2 text-red-700 font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Teste expirado</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              {trial_end &&
                `Expirou em ${format(new Date(trial_end), "dd/MM/yyyy", {
                  locale: ptBR,
                })}`}
            </p>
          </div>
          <Button onClick={createCheckout} className="w-full gap-2" size="lg">
            <Crown className="h-4 w-4" />
            Assinar Premium - R$ 39,90/mês
          </Button>
          <p className="text-sm text-muted-foreground">
            Continue aproveitando todos os recursos com uma assinatura Premium!
          </p>
        </CardContent>
      </Card>
    );
  }

  // If user is in trial (either marked as subscribed trial or active trial), show trial card
  if (isInTrial) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <Crown className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle className="text-xl">Período de Teste Gratuito</CardTitle>
          <CardDescription>
            Você tem {trialDaysRemaining}{" "}
            {trialDaysRemaining === 1 ? "dia restante" : "dias restantes"} no
            seu teste gratuito de 7 dias.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-2 text-orange-700 font-medium">
              <Calendar className="h-4 w-4" />
              <span>
                {trialDaysRemaining}{" "}
                {trialDaysRemaining === 1 ? "dia restante" : "dias restantes"}
              </span>
            </div>
            <p className="text-sm text-orange-600 mt-1">
              Seu teste termina em{" "}
              {format(new Date(trial_end), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          <Button onClick={createCheckout} className="w-full gap-2" size="lg">
            <Crown className="h-4 w-4" />
            Assinar Premium - R$ 39,90/mês
          </Button>
          <p className="text-sm text-muted-foreground">
            Continue aproveitando todos os recursos após o teste!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Only show "Upgrade" card if user has no subscription AND no trial history AND is not already marked as Trial
  // This should rarely happen since trial is auto-created, but serves as fallback
  if (
    !hasRealSubscription &&
    !isInTrial &&
    !isTrialExpired &&
    subscription_tier !== "Trial"
  ) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <Crown className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle className="text-xl">Assinatura Premium</CardTitle>
          <CardDescription>
            Aproveite todos os recursos do seu dashboard financeiro
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-blue-50 dark:bg-transparent border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
              <Crown className="h-4 w-4" />
              <span>Bem-vindo! Seu teste gratuito já está ativo.</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Aproveite 7 dias grátis com todos os recursos
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Seu período de teste será exibido aqui em instantes...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status da Assinatura */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Assinatura Premium
            </CardTitle>
            <CardDescription>
              Gerencie sua assinatura e informações de pagamento
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSubscription}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plano</p>
              <Badge variant="outline" className="mt-1">
                {subscription_tier}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <Badge
                variant={getStatusBadgeVariant(
                  status || (last_payment_status ?? "")
                )}
                className="mt-1"
              >
                {status
                  ? getStatusText(status)
                  : last_payment_status
                  ? isSuccessStatus(last_payment_status)
                    ? "Pago"
                    : last_payment_status
                  : "—"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor</p>
              <p className="font-semibold">
                {amount && currency
                  ? formatCurrency(amount, currency)
                  : last_payment_amount && last_payment_currency
                  ? formatCurrency(last_payment_amount, last_payment_currency)
                  : "R$ 39,90/mês"}
              </p>
            </div>
          </div>

          {/* Próxima Renovação - Seção em destaque */}
          {current_period_end && (
            <div className="bg-blue-50 dark:bg-transparent border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  Próxima Renovação
                </h3>
              </div>
              <p className="text-blue-700 font-medium">
                {format(
                  new Date(current_period_end),
                  "dd 'de' MMMM 'de' yyyy",
                  {
                    locale: ptBR,
                  }
                )}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Sua assinatura será renovada automaticamente nesta data
              </p>
            </div>
          )}

          {subscription_start && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Assinante desde{" "}
                {format(new Date(subscription_start), "MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
          )}

          {cancel_at_period_end && (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cancelamento agendado:</strong> Sua assinatura será
                cancelada em{" "}
                {current_period_end
                  ? format(
                      new Date(current_period_end),
                      "dd 'de' MMMM 'de' yyyy",
                      {
                        locale: ptBR,
                      }
                    )
                  : "N/A"}
                . Você manterá acesso até esta data.
              </AlertDescription>
            </Alert>
          )}

          {trial_end && new Date(trial_end) > new Date() && (
            <Alert>
              <Gift className="h-4 w-4" />
              <AlertDescription>
                Período de teste até{" "}
                {format(new Date(trial_end), "dd/MM/yyyy", { locale: ptBR })}
              </AlertDescription>
            </Alert>
          )}

          {discount && (
            <Alert>
              <Gift className="h-4 w-4" />
              <AlertDescription>
                Desconto ativo: {discount.coupon.name || discount.coupon.id}
                {discount.coupon.percent_off &&
                  ` (${discount.coupon.percent_off}% off)`}
                {discount.end &&
                  ` até ${format(new Date(discount.end), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Método de Pagamento */}
      {paymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Método de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">
                    {(paymentMethod.brand || paymentMethod.type || "Cartão")
                      .toString()
                      .toUpperCase()}{" "}
                    {paymentMethod.last4 ? ` •••• ${paymentMethod.last4}` : ""}
                  </p>
                  {paymentMethod.exp_month && paymentMethod.exp_year ? (
                    <p className="text-sm text-muted-foreground">
                      Expira em{" "}
                      {String(paymentMethod.exp_month).padStart(2, "0")}/
                      {String(paymentMethod.exp_year)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Método de pagamento configurado
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Assinatura</CardTitle>
          <CardDescription>
            {cancel_at_period_end
              ? "Sua assinatura está agendada para cancelamento"
              : "Cancele sua assinatura a qualquer momento"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!cancel_at_period_end && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  disabled={loadingCancel}
                >
                  <XCircle className="h-4 w-4" />
                  {loadingCancel ? "Cancelando..." : "Cancelar Assinatura"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>Tem certeza que deseja cancelar sua assinatura?</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Importante:</strong> Você manterá acesso a todos
                        os recursos até{" "}
                        {current_period_end
                          ? format(
                              new Date(current_period_end),
                              "dd 'de' MMMM 'de' yyyy",
                              {
                                locale: ptBR,
                              }
                            )
                          : "o fim do período atual"}
                        . Após essa data, sua conta será limitada.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Manter Assinatura</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, Cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {cancel_at_period_end && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                <span>Cancelamento Agendado</span>
              </div>
              <p className="text-sm text-orange-600">
                Sua assinatura foi cancelada e você manterá acesso até{" "}
                {current_period_end
                  ? format(
                      new Date(current_period_end),
                      "dd 'de' MMMM 'de' yyyy",
                      {
                        locale: ptBR,
                      }
                    )
                  : "o fim do período atual"}
                .
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            {cancel_at_period_end
              ? "Entre em contato conosco se precisar reativar sua assinatura."
              : "Você pode cancelar sua assinatura a qualquer momento. O cancelamento entrará em vigor no fim do período atual."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

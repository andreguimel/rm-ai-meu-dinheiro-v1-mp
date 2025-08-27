import { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, Calendar, CreditCard, RefreshCw, Download, AlertCircle, Gift, Settings, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { subscriptionData, loading, checkSubscription, createCheckout, openCustomerPortal, getPaymentHistory } = useSubscription();
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (subscriptionData.subscribed) {
      loadPaymentHistory();
    }
  }, [subscriptionData.subscribed]);

  const loadPaymentHistory = async () => {
    setLoadingHistory(true);
    const history = await getPaymentHistory();
    setPaymentHistory(history);
    setLoadingHistory(false);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trialing': return 'secondary';
      case 'canceled': return 'destructive';
      case 'past_due': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'trialing': return 'Em Teste';
      case 'canceled': return 'Cancelada';
      case 'past_due': return 'Vencida';
      case 'incomplete': return 'Incompleta';
      default: return status;
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

  const { subscribed, subscription_tier, subscription_end, status, amount, currency, current_period_end, subscription_start, cancel_at_period_end, trial_end, payment_method: rawPaymentMethod, last_payment_amount, last_payment_currency, last_payment_status, discount } = subscriptionData;

  // Normaliza diferentes formatos que podem vir do backend:
  const paymentMethod = (() => {
    if (!rawPaymentMethod) return null;
    if ((rawPaymentMethod as any).card) {
      const c = (rawPaymentMethod as any).card;
      return {
        type: (rawPaymentMethod as any).type || 'card',
        brand: c.brand || null,
        last4: c.last4 || c.last_four_digits || null,
        exp_month: c.exp_month || c.expiration_month || null,
        exp_year: c.exp_year || c.expiration_year || null,
      };
    }
    return {
      type: (rawPaymentMethod as any).type || 'card',
      brand: (rawPaymentMethod as any).brand || null,
      last4: (rawPaymentMethod as any).last4 || (rawPaymentMethod as any).last_four_digits || null,
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
  const hasActiveTrial = !!trial_end && new Date(trial_end).getTime() > Date.now();

  if (!subscribed && hasActiveTrial) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <Crown className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle className="text-xl">Teste</CardTitle>
          <CardDescription>
            Você está em período de teste. Aproveite os recursos até o término do teste.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button onClick={createCheckout} className="w-full gap-2" size="lg">
            <Crown className="h-4 w-4" />
            Assinar Premium - R$ 39,90/mês
          </Button>
          <p className="text-sm text-muted-foreground">
            Seu teste termina em {format(new Date(trial_end), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!subscribed) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <Crown className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle className="text-xl">Assinatura Premium</CardTitle>
          <CardDescription>
            Desbloqueie todos os recursos do dashboard financeiro
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button onClick={createCheckout} className="w-full gap-2" size="lg">
            <Crown className="h-4 w-4" />
            Assinar Premium - R$ 39,90/mês
          </Button>
          <p className="text-sm text-muted-foreground">
            Acesso completo a relatórios avançados, análises de IA e muito mais
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
          <Button variant="outline" size="sm" onClick={checkSubscription} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plano</p>
              <Badge variant="outline" className="mt-1">{subscription_tier}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={getStatusBadgeVariant(status || (last_payment_status ?? ''))} className="mt-1">
                {status ? getStatusText(status) : (last_payment_status ? (isSuccessStatus(last_payment_status) ? 'Pago' : last_payment_status) : '—')}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor</p>
              <p className="font-semibold">
                {amount && currency
                  ? formatCurrency(amount, currency)
                  : (last_payment_amount && last_payment_currency ? formatCurrency(last_payment_amount, last_payment_currency) : 'N/A')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Próxima cobrança</p>
              <p className="text-sm">
                {current_period_end ? format(new Date(current_period_end), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
              </p>
            </div>
          </div>

          {subscription_start && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Assinante desde {format(new Date(subscription_start), "MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
          )}

          {cancel_at_period_end && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sua assinatura será cancelada em {current_period_end ? format(new Date(current_period_end), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
              </AlertDescription>
            </Alert>
          )}

          {trial_end && new Date(trial_end) > new Date() && (
            <Alert>
              <Gift className="h-4 w-4" />
              <AlertDescription>
                Período de teste até {format(new Date(trial_end), "dd/MM/yyyy", { locale: ptBR })}
              </AlertDescription>
            </Alert>
          )}

          {discount && (
            <Alert>
              <Gift className="h-4 w-4" />
              <AlertDescription>
                Desconto ativo: {discount.coupon.name || discount.coupon.id}
                {discount.coupon.percent_off && ` (${discount.coupon.percent_off}% off)`}
                {discount.end && ` até ${format(new Date(discount.end), "dd/MM/yyyy", { locale: ptBR })}`}
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
                    {(paymentMethod.brand || paymentMethod.type || 'Cartão').toString().toUpperCase()} {paymentMethod.last4 ? ` •••• ${paymentMethod.last4}` : ''}
                  </p>
                  {paymentMethod.exp_month && paymentMethod.exp_year ? (
                    <p className="text-sm text-muted-foreground">
                      Expira em {String(paymentMethod.exp_month).padStart(2, '0')}/{String(paymentMethod.exp_year)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Informações de validade indisponíveis</p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={openCustomerPortal}>
                Editar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <Button variant="outline" size="sm" onClick={loadPaymentHistory} disabled={loadingHistory}>
            <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {paymentHistory.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.created)} • {(payment.payment_method_details.type || (payment.payment_method_details.card?.brand) || 'CARD').toString().toUpperCase()} {payment.payment_method_details.card?.last4 ? ` •••• ${payment.payment_method_details.card?.last4}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isSuccessStatus(payment.status) ? 'default' : 'destructive'}>
                      {isSuccessStatus(payment.status) ? 'Pago' : 'Falhou'}
                    </Badge>
                    {payment.receipt_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum pagamento encontrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Assinatura</CardTitle>
          <CardDescription>
            Altere seu plano, método de pagamento ou cancele sua assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={openCustomerPortal} className="w-full gap-2" variant="outline">
            <Settings className="h-4 w-4" />
            Cancelar Assinatura
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Gerencie sua assinatura do MercadoPago. Você pode cancelar sua assinatura a qualquer momento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
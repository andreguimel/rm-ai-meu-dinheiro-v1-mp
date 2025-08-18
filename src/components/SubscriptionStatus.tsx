import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, CreditCard, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export const SubscriptionStatus = () => {
  const { subscriptionData, loading, checkSubscription, createCheckout, openCustomerPortal } = useSubscription();

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

  const { subscribed, subscription_tier, subscription_end } = subscriptionData;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Status da Assinatura
          </CardTitle>
          <CardDescription>
            Gerencie sua assinatura e acesso aos recursos premium
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
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={subscribed ? "default" : "secondary"}>
            {subscribed ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        {subscribed && subscription_tier && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plano:</span>
            <Badge variant="outline">{subscription_tier}</Badge>
          </div>
        )}

        {subscribed && subscription_end && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Renovação:
            </span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(subscription_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
        )}

        <div className="pt-4 space-y-2">
          {subscribed ? (
            <Button
              onClick={openCustomerPortal}
              className="w-full gap-2"
              variant="outline"
            >
              <CreditCard className="h-4 w-4" />
              Gerenciar Assinatura
            </Button>
          ) : (
            <Button
              onClick={createCheckout}
              className="w-full gap-2"
            >
              <Crown className="h-4 w-4" />
              Assinar Premium - R$ 39,90/mês
            </Button>
          )}
        </div>

        {!subscribed && (
          <div className="text-sm text-muted-foreground text-center">
            <p>Desbloqueie todos os recursos do dashboard financeiro com a assinatura premium.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
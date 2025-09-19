import React from 'react';
import { Bell, Clock, AlertTriangle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificacoes, NotificacaoLembrete } from '@/hooks/useNotificacoes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificacaoLembretesProps {
  onClose?: () => void;
  compact?: boolean;
}

export const NotificacaoLembretes: React.FC<NotificacaoLembretesProps> = ({ 
  onClose, 
  compact = false 
}) => {
  const { notificacoesPendentes } = useNotificacoes();

  if (notificacoesPendentes.length === 0) {
    return null;
  }

  const getStatusColor = (diasRestantes: number) => {
    if (diasRestantes < 0) return 'destructive';
    if (diasRestantes === 0) return 'destructive';
    if (diasRestantes === 1) return 'warning';
    return 'default';
  };

  const getStatusText = (diasRestantes: number) => {
    if (diasRestantes < 0) return `Vencido há ${Math.abs(diasRestantes)} dia(s)`;
    if (diasRestantes === 0) return 'Vence hoje';
    if (diasRestantes === 1) return 'Vence amanhã';
    return `${diasRestantes} dias restantes`;
  };

  const getStatusIcon = (diasRestantes: number) => {
    if (diasRestantes <= 0) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'destructive';
      case 'media': return 'warning';
      case 'baixa': return 'secondary';
      default: return 'default';
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {notificacoesPendentes.slice(0, 3).map((notificacao) => (
          <div
            key={notificacao.id}
            className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border"
          >
            {getStatusIcon(notificacao.diasRestantes)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {notificacao.titulo}
              </p>
              <p className="text-xs text-muted-foreground">
                {getStatusText(notificacao.diasRestantes)}
              </p>
            </div>
            <Badge 
              variant={getPrioridadeColor(notificacao.prioridade)}
              className="text-xs"
            >
              {notificacao.prioridade}
            </Badge>
          </div>
        ))}
        {notificacoesPendentes.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{notificacoesPendentes.length - 3} mais lembretes
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-500" />
          Lembretes Pendentes
          <Badge variant="secondary" className="ml-2">
            {notificacoesPendentes.length}
          </Badge>
        </CardTitle>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {notificacoesPendentes.map((notificacao) => (
          <div
            key={notificacao.id}
            className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(notificacao.diasRestantes)}
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">
                  {notificacao.titulo}
                </h4>
                <Badge 
                  variant={getPrioridadeColor(notificacao.prioridade)}
                  className="text-xs"
                >
                  {notificacao.prioridade}
                </Badge>
              </div>
              
              {notificacao.descricao && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {notificacao.descricao}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <Badge 
                  variant={getStatusColor(notificacao.diasRestantes)}
                  className="text-xs"
                >
                  {getStatusText(notificacao.diasRestantes)}
                </Badge>
                
                <span className="text-xs text-muted-foreground">
                  {format(notificacao.dataVencimento, "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.location.href = '/lembretes'}
          >
            Ver todos os lembretes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
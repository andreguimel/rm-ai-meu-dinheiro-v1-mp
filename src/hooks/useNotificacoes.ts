import { useEffect, useState } from 'react';
import { useLembretes } from './useLembretes';
import { toast } from 'sonner';

export interface NotificacaoLembrete {
  id: string;
  titulo: string;
  descricao?: string;
  dataVencimento: Date;
  prioridade: 'baixa' | 'media' | 'alta';
  diasRestantes: number;
}

export const useNotificacoes = () => {
  const { lembretes } = useLembretes();
  const [notificacoesPendentes, setNotificacoesPendentes] = useState<NotificacaoLembrete[]>([]);

  // Função para calcular dias restantes
  const calcularDiasRestantes = (dataVencimento: Date): number => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    const diffTime = vencimento.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Função para verificar lembretes próximos do vencimento
  const verificarLembretesProximos = () => {
    const lembretesProximos: NotificacaoLembrete[] = [];
    
    lembretes.forEach(lembrete => {
      if (lembrete.concluido) return;
      
      const diasRestantes = calcularDiasRestantes(new Date(lembrete.dataVencimento));
      
      // Notificar lembretes que vencem hoje, amanhã ou estão vencidos
      if (diasRestantes <= 1) {
        lembretesProximos.push({
          id: lembrete.id,
          titulo: lembrete.titulo,
          descricao: lembrete.descricao,
          dataVencimento: new Date(lembrete.dataVencimento),
          prioridade: lembrete.prioridade,
          diasRestantes
        });
      }
    });

    setNotificacoesPendentes(lembretesProximos);
    return lembretesProximos;
  };

  // Função para mostrar notificações toast
  const mostrarNotificacoes = (notificacoes: NotificacaoLembrete[]) => {
    notificacoes.forEach(notificacao => {
      const { titulo, diasRestantes, prioridade } = notificacao;
      
      let mensagem = '';
      let tipo: 'success' | 'info' | 'warning' | 'error' = 'info';
      
      if (diasRestantes < 0) {
        mensagem = `Lembrete "${titulo}" está vencido há ${Math.abs(diasRestantes)} dia(s)!`;
        tipo = 'error';
      } else if (diasRestantes === 0) {
        mensagem = `Lembrete "${titulo}" vence hoje!`;
        tipo = prioridade === 'alta' ? 'error' : 'warning';
      } else if (diasRestantes === 1) {
        mensagem = `Lembrete "${titulo}" vence amanhã!`;
        tipo = 'warning';
      }

      if (mensagem) {
        toast[tipo](mensagem, {
          duration: 5000,
          action: {
            label: 'Ver',
            onClick: () => {
              // Navegar para a página de lembretes
              window.location.href = '/lembretes';
            }
          }
        });
      }
    });
  };

  // Verificar notificações ao carregar e quando lembretes mudarem
  useEffect(() => {
    if (lembretes.length > 0) {
      const notificacoes = verificarLembretesProximos();
      if (notificacoes.length > 0) {
        mostrarNotificacoes(notificacoes);
      }
    }
  }, [lembretes]);

  // Verificar notificações periodicamente (a cada 5 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      const notificacoes = verificarLembretesProximos();
      if (notificacoes.length > 0) {
        mostrarNotificacoes(notificacoes);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [lembretes]);

  return {
    notificacoesPendentes,
    verificarLembretesProximos,
    mostrarNotificacoes
  };
};
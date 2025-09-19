import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificacaoLembretes } from './NotificacaoLembretes';

interface NotificacaoIconProps {
  className?: string;
}

export const NotificacaoIcon: React.FC<NotificacaoIconProps> = ({ className }) => {
  const { notificacoesPendentes } = useNotificacoes();
  const [isOpen, setIsOpen] = React.useState(false);

  const hasNotifications = notificacoesPendentes.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative p-2 ${className}`}
        >
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {notificacoesPendentes.length > 9 ? '9+' : notificacoesPendentes.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {hasNotifications ? (
          <NotificacaoLembretes onClose={() => setIsOpen(false)} />
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma notificação pendente</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
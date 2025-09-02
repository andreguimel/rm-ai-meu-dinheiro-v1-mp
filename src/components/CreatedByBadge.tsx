import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSharedUsers } from "@/hooks/useSharedUsers";
import { useProfile } from "@/hooks/useProfile";
import { User } from "lucide-react";

interface CreatedByBadgeProps {
  userId: string;
  createdBySharedUserId?: string;
  className?: string;
}

export function CreatedByBadge({
  userId,
  createdBySharedUserId,
  className = "",
}: CreatedByBadgeProps) {
  const { user } = useAuth();
  const { sharedUsers } = useSharedUsers();
  const { profile } = useProfile();

  // Se foi criado por um usuário compartilhado específico
  if (createdBySharedUserId) {
    const sharedUser = sharedUsers.find(
      (su) => su.id === createdBySharedUserId
    );

    if (sharedUser) {
      return (
        <Badge
          variant="secondary"
          className={`flex items-center gap-1 ${className}`}
        >
          <User className="h-3 w-3" />
          {sharedUser.name}
        </Badge>
      );
    }
  }

  // Se é o usuário atual (conta principal)
  if (userId === user?.id) {
    const userName = profile?.name || user?.email?.split("@")[0] || "Você";
    return (
      <Badge
        variant="default"
        className={`flex items-center gap-1 ${className}`}
      >
        <User className="h-3 w-3" />
        {userName === user?.email?.split("@")[0] ? "Você" : userName}
      </Badge>
    );
  }

  // Fallback: buscar nas informações de usuários compartilhados pelo user_id (método antigo)
  const sharedUser = sharedUsers.find((su) => su.shared_user_id === userId);

  if (sharedUser) {
    return (
      <Badge
        variant="secondary"
        className={`flex items-center gap-1 ${className}`}
      >
        <User className="h-3 w-3" />
        {sharedUser.name}
      </Badge>
    );
  }

  // Se não encontrou o usuário (pode ser um usuário que já foi removido)
  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 text-muted-foreground ${className}`}
    >
      <User className="h-3 w-3" />
      Usuário desconhecido
    </Badge>
  );
}

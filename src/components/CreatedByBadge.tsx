import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSharedUsers } from "@/hooks/useSharedUsers";
import { useProfile } from "@/hooks/useProfile";
import { User } from "lucide-react";

interface CreatedByBadgeProps {
  userId?: string;
  createdBySharedUserId?: string;
  className?: string;
  size?: "sm" | "default";
}

export function CreatedByBadge({
  userId,
  createdBySharedUserId,
  className = "",
  size = "default",
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
          className={`flex items-center gap-1 ${size === "sm" ? "text-xs px-1 py-0" : ""} ${className}`}
        >
          <User className={size === "sm" ? "h-2 w-2" : "h-3 w-3"} />
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
        className={`flex items-center gap-1 ${size === "sm" ? "text-xs px-1 py-0" : ""} ${className}`}
      >
        <User className={size === "sm" ? "h-2 w-2" : "h-3 w-3"} />
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
        className={`flex items-center gap-1 ${size === "sm" ? "text-xs px-1 py-0" : ""} ${className}`}
      >
        <User className={size === "sm" ? "h-2 w-2" : "h-3 w-3"} />
        {sharedUser.name}
      </Badge>
    );
  }

  // Se não encontrou o usuário mas temos um userId, mostrar nome baseado no perfil
  if (userId && !createdBySharedUserId) {
    const userName = profile?.name || user?.email?.split("@")[0] || "Usuário";
    return (
      <Badge
        variant="default"
        className={`flex items-center gap-1 ${size === "sm" ? "text-xs px-1 py-0" : ""} ${className}`}
      >
        <User className={size === "sm" ? "h-2 w-2" : "h-3 w-3"} />
        {userName}
      </Badge>
    );
  }

  // Se não encontrou o usuário (pode ser um usuário que já foi removido)
  return null; // Não mostrar badge se não conseguir identificar o usuário
}

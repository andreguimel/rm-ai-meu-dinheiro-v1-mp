import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SharedUser {
  id: string;
  owner_user_id: string;
  shared_user_id: string;
  name: string;
  whatsapp: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateSharedUserData {
  name: string;
  whatsapp: string;
}

export const useSharedUsers = () => {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainAccountUserId, setMainAccountUserId] = useState<string | null>(
    null
  );
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSharedUsers();
      fetchMainAccountUserId();
    }
  }, [user]);

  const fetchMainAccountUserId = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("get_main_account_user_id", {
        user_id: user.id,
      });

      if (error) throw error;
      setMainAccountUserId(data);
    } catch (error) {
      console.error("Erro ao buscar user_id da conta principal:", error);
    }
  };

  const fetchSharedUsers = async () => {
    if (!user) return;

    try {
      console.log("=== DEBUG FETCH SHARED USERS ===");
      console.log("User ID:", user.id);

      const { data, error } = await supabase
        .from("shared_users")
        .select("*")
        .eq("owner_user_id", user.id)
        .eq("active", true)
        .order("created_at", { ascending: false });

      console.log("Shared users encontrados:", data);
      console.log("Erro (se houver):", error);
      console.log("===============================");

      if (error) throw error;
      setSharedUsers(data || []);
    } catch (error) {
      console.error("Erro ao buscar usuários compartilhados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários compartilhados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSharedUser = async (userData: CreateSharedUserData) => {
    if (!user) return { error: "Usuário não autenticado" };

    if (sharedUsers.length >= 3) {
      toast({
        title: "Limite atingido",
        description:
          "Você pode compartilhar sua conta com no máximo 3 usuários.",
        variant: "destructive",
      });
      return { error: "Limite de usuários atingido" };
    }

    try {
      const { data, error } = await supabase
        .from("shared_users")
        .insert({
          owner_user_id: user.id,
          shared_user_id: null, // Não vincula a um usuário específico
          name: userData.name,
          whatsapp: userData.whatsapp,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchSharedUsers();

      toast({
        title: "Sucesso",
        description: `Acesso compartilhado com ${userData.name} com sucesso!`,
      });

      return { data, error: null };
    } catch (error: any) {
      console.error("Erro ao adicionar usuário compartilhado:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível compartilhar o acesso.",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const removeSharedUser = async (sharedUserId: string) => {
    if (!user) return;

    try {
      // Primeiro, remover a referência do usuário compartilhado em todos os registros
      const tables = ["receitas", "despesas", "transacoes", "dividas", "metas"];

      for (const table of tables) {
        await supabase
          .from(table)
          .update({ created_by_shared_user_id: null })
          .eq("created_by_shared_user_id", sharedUserId);
      }

      // Depois, deletar o usuário compartilhado
      const { error } = await supabase
        .from("shared_users")
        .delete()
        .eq("id", sharedUserId)
        .eq("owner_user_id", user.id);

      if (error) throw error;

      await fetchSharedUsers();

      toast({
        title: "Sucesso",
        description:
          "Acesso removido com sucesso! Os registros criados por este usuário foram mantidos.",
      });
    } catch (error: any) {
      console.error("Erro ao remover usuário compartilhado:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o acesso.",
        variant: "destructive",
      });
    }
  };

  const updateSharedUser = async (
    sharedUserId: string,
    updates: Partial<Pick<SharedUser, "name" | "whatsapp">>
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("shared_users")
        .update(updates)
        .eq("id", sharedUserId)
        .eq("owner_user_id", user.id);

      if (error) throw error;

      await fetchSharedUsers();

      toast({
        title: "Sucesso",
        description: "Informações atualizadas com sucesso!",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar usuário compartilhado:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as informações.",
        variant: "destructive",
      });
    }
  };

  const isAccountOwner = () => {
    return user?.id === mainAccountUserId;
  };

  const canManageSharedUsers = () => {
    return isAccountOwner();
  };

  return {
    sharedUsers,
    loading,
    mainAccountUserId,
    addSharedUser,
    removeSharedUser,
    updateSharedUser,
    refetch: fetchSharedUsers,
    isAccountOwner,
    canManageSharedUsers,
    remainingSlots: Math.max(0, 3 - sharedUsers.length),
  };
};

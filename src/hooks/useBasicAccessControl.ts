import React from "react";
import { useBasicAccess } from "@/components/BasicAccessProvider";
import { useToast } from "@/hooks/use-toast";

export const useBasicAccessControl = () => {
  const { isBasicAccess, showUpgradePrompt } = useBasicAccess();
  const { toast } = useToast();

  const checkAccess = (action: string = "esta ação") => {
    if (isBasicAccess) {
      toast({
        title: "Acesso limitado",
        description: `Para ${action}, você precisa assinar o plano premium. Clique aqui para assinar.`,
        variant: "destructive",
        onClick: showUpgradePrompt,
      });
      return false;
    }
    return true;
  };

  const wrapAction = <T extends any[]>(
    action: (...args: T) => void | Promise<void>,
    actionName?: string
  ) => {
    return (...args: T) => {
      if (checkAccess(actionName)) {
        return action(...args);
      }
    };
  };

  return {
    isBasicAccess,
    checkAccess,
    wrapAction,
    showUpgradePrompt,
  };
};

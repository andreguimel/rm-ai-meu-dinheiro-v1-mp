import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, Eye, Lock } from "lucide-react";
import { useBasicAccess } from "@/components/BasicAccessProvider";

export const BasicAccessBanner = () => {
  const { isBasicAccess, showUpgradePrompt } = useBasicAccess();

  if (!isBasicAccess) {
    return null;
  }

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <Eye className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lock className="h-4 w-4 text-orange-600" />
          <span className="text-orange-800">
            <strong>Modo de visualização:</strong> Seu período de teste expirou.
            Você pode visualizar seus dados, mas não pode criar ou editar.
          </span>
        </div>
        <Button
          onClick={showUpgradePrompt}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white ml-4"
        >
          <Crown className="h-3 w-3 mr-1" />
          Assinar
        </Button>
      </AlertDescription>
    </Alert>
  );
};

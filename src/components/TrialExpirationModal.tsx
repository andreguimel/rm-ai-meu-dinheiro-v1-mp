import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown, Check } from "lucide-react";

interface TrialExpirationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
  isExpired: boolean;
  daysRemaining?: number | null;
}

export const TrialExpirationModal = ({
  open,
  onOpenChange,
  onUpgrade,
  isExpired,
  daysRemaining,
}: TrialExpirationModalProps) => {
  const handleUpgrade = () => {
    onUpgrade();
    onOpenChange(false);
  };

  const handleContinueWithLimitedAccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            {isExpired ? (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-orange-600" />
              </div>
            )}
          </div>
          <DialogTitle className="text-center text-xl">
            {isExpired
              ? "Período de teste expirado"
              : `Seu teste expira em ${daysRemaining} ${
                  daysRemaining === 1 ? "dia" : "dias"
                }`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center text-gray-600">
            {isExpired ? (
              <p>
                Seu período de teste de 7 dias chegou ao fim. Para continuar
                aproveitando todas as funcionalidades do Meu Dinheiro, assine
                nosso plano mensal.
              </p>
            ) : (
              <p>
                Não perca o acesso a todas as funcionalidades premium! Assine
                agora e continue organizando suas finanças sem interrupções.
              </p>
            )}
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
              <Crown className="w-4 h-4 mr-2" />
              Com o plano premium você tem:
            </h4>
            <ul className="space-y-1 text-sm text-orange-700">
              <li className="flex items-center">
                <Check className="w-3 h-3 mr-2 text-orange-600" />
                Controle completo de receitas e despesas
              </li>
              <li className="flex items-center">
                <Check className="w-3 h-3 mr-2 text-orange-600" />
                Gestão de veículos e manutenções
              </li>
              <li className="flex items-center">
                <Check className="w-3 h-3 mr-2 text-orange-600" />
                Relatórios detalhados e gráficos
              </li>
              <li className="flex items-center">
                <Check className="w-3 h-3 mr-2 text-orange-600" />
                Compartilhamento com outros usuários
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Assinar por R$ 9,90/mês
            </Button>

            {isExpired && (
              <Button
                onClick={handleContinueWithLimitedAccess}
                variant="outline"
                className="w-full text-gray-600 border-gray-300"
              >
                Continuar com acesso limitado
              </Button>
            )}
          </div>

          {!isExpired && (
            <div className="text-center">
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                className="text-gray-500 text-sm"
              >
                Lembrar mais tarde
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

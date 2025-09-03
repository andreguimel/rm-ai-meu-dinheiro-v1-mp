import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, RotateCcw } from "lucide-react";

interface ReCaptchaProps {
  onVerify: (verified: boolean) => void;
  isVerified: boolean;
}

export const ReCaptcha = ({ onVerify, isVerified }: ReCaptchaProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);

    // Simular verificação (em produção você usaria Google reCAPTCHA)
    setTimeout(() => {
      onVerify(true);
      setIsLoading(false);
    }, 1500);
  };

  const handleReset = () => {
    onVerify(false);
  };

  return (
    <div className="border border-gray-300 rounded-md bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-6 h-6 border-2 rounded-sm flex items-center justify-center cursor-pointer transition-colors ${
              isVerified
                ? "bg-green-500 border-green-500"
                : isLoading
                ? "border-blue-500 bg-blue-50"
                : "border-gray-400 bg-white hover:border-gray-500"
            }`}
            onClick={!isVerified && !isLoading ? handleVerify : undefined}
          >
            {isVerified && <CheckCircle className="w-4 h-4 text-white" />}
            {isLoading && (
              <RotateCcw className="w-4 h-4 text-blue-500 animate-spin" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {isLoading ? "Verificando..." : "Não sou um robô"}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <Shield className="w-8 h-8 text-blue-600 mb-1" />
          <div className="text-xs text-gray-500 text-center">
            <div>reCAPTCHA</div>
            <div className="text-xs">Privacidade - Termos</div>
          </div>
        </div>
      </div>

      {isVerified && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Verificar novamente
          </Button>
        </div>
      )}
    </div>
  );
};

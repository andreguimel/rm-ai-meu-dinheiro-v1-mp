import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReCaptcha } from "@/components/ui/ReCaptcha";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
}

export const LoginForm = ({
  onSwitchToRegister,
  onSwitchToForgot,
}: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReCaptchaVerified, setIsReCaptchaVerified] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validações básicas
    if (!email.trim()) {
      setError("Email é obrigatório");
      setIsLoading(false);
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Email deve ter um formato válido");
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Senha é obrigatória");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    if (!isReCaptchaVerified) {
      setError("Por favor, complete a verificação de segurança");
      setIsLoading(false);
      return;
    }

    try {
      console.log("🔐 Tentando fazer login com:", JSON.stringify({ email: email.trim() }, null, 2));

      const { data, error: authError } = await signIn(email.trim(), password);

      console.log("🔐 Resultado do login:", JSON.stringify({ data, authError }, null, 2));

      if (authError) {
        console.error("❌ Erro de autenticação:", authError);

        // Tratar diferentes tipos de erro
        let errorMessage = "Erro ao fazer login";

        if (authError.message?.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos";
        } else if (authError.message?.includes("Email not confirmed")) {
          errorMessage = "Email não confirmado. Verifique sua caixa de entrada";
        } else if (authError.message?.includes("Too many requests")) {
          errorMessage = "Muitas tentativas. Tente novamente em alguns minutos";
        } else if (authError.message?.includes("Network error")) {
          errorMessage = "Erro de conexão. Verifique sua internet";
        } else if (authError.message) {
          errorMessage = authError.message;
        }

        setError(errorMessage);
        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (data?.user) {
        console.log("✅ Login realizado com sucesso:", data.user.email);
        toast({
          title: "Login realizado!",
          description: `Bem-vindo(a), ${data.user.email}!`,
        });
        navigate("/dashboard");
      } else {
        setError("Erro inesperado durante o login");
        console.error("❌ Login falhou sem erro específico");
      }
    } catch (err) {
      console.error("❌ Erro inesperado no login:", err);
      setError("Erro inesperado. Tente novamente");
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
            autoComplete="current-password"
            minLength={6}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onSwitchToForgot}
          className="text-sm text-orange-600 hover:text-orange-500"
        >
          Esqueceu a senha?
        </button>
      </div>

      <ReCaptcha
        onVerify={setIsReCaptchaVerified}
        isVerified={isReCaptchaVerified}
      />

      <Button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600"
        disabled={isLoading || !isReCaptchaVerified}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>

      <div className="text-center">
        <span className="text-sm text-gray-600">
          Não tem uma conta?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-orange-600 hover:text-orange-500 font-medium"
          >
            Cadastre-se
          </button>
        </span>
      </div>
    </form>
  );
};

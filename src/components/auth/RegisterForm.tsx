import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReCaptcha } from "@/components/ui/ReCaptcha";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { applyPhoneMask, cleanPhoneForStorage } from "@/lib/utils";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm = ({ onSwitchToLogin }: RegisterFormProps) => {
  const [name, setName] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReCaptchaVerified, setIsReCaptchaVerified] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validações básicas
    if (!name.trim()) {
      setError("Nome é obrigatório");
      setIsLoading(false);
      return;
    }

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

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    if (!telefone.trim()) {
      setError("Telefone é obrigatório");
      setIsLoading(false);
      return;
    }

    if (!isReCaptchaVerified) {
      setError("Por favor, complete a verificação de segurança");
      setIsLoading(false);
      return;
    }

    try {
      console.log("📝 Tentando criar conta para:", {
        email: email.trim(),
        name,
      });

      // Preparar metadata do usuário
      const metadata = {
        name: name.trim(),
        telefone: cleanPhoneForStorage(telefone),
      };

      const { data, error: authError } = await signUp(
        email.trim(),
        password,
        metadata
      );

      console.log("📝 Resultado do registro:", JSON.stringify({ data, authError }, null, 2));

      if (authError) {
        console.error("❌ Erro de registro:", authError);

        // Tratar diferentes tipos de erro
        let errorMessage = "Erro ao criar conta";

        if (authError.message?.includes("User already registered")) {
          errorMessage = "Este email já está cadastrado";
        } else if (authError.message?.includes("Password should be at least")) {
          errorMessage = "Senha deve ter pelo menos 6 caracteres";
        } else if (authError.message?.includes("Invalid email")) {
          errorMessage = "Email inválido";
        } else if (authError.message?.includes("weak password")) {
          errorMessage = "Senha muito fraca. Use pelo menos 6 caracteres";
        } else if (authError.message) {
          errorMessage = authError.message;
        }

        setError(errorMessage);
        toast({
          title: "Erro ao criar conta",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (data?.user) {
        console.log("✅ Conta criada com sucesso:", data.user.email);

        // Verificar se precisa confirmar email
        if (data.session) {
          // Usuario logado automaticamente
          toast({
            title: "Conta criada!",
            description: `Bem-vindo(a), ${data.user.email}!`,
          });
          navigate("/dashboard");
        } else {
          // Precisa confirmar email
          toast({
            title: "Conta criada!",
            description:
              "Verifique seu email para confirmar a conta e depois faça login.",
          });
          onSwitchToLogin();
        }
      } else {
        setError("Erro inesperado durante o registro");
        console.error("❌ Registro falhou sem erro específico");
      }
    } catch (err) {
      console.error("❌ Erro inesperado no registro:", err);
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
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome completo"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefone">WhatsApp</Label>
        <Input
          id="telefone"
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(applyPhoneMask(e.target.value))}
          placeholder="(11) 9 9999-9999"
          maxLength={16}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
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
            placeholder="Mínimo 6 caracteres"
            required
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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme sua senha"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
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
        {isLoading ? "Criando conta..." : "Criar conta"}
      </Button>

      <div className="text-center">
        <span className="text-sm text-gray-600">
          Já tem uma conta?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-orange-600 hover:text-orange-500 font-medium"
          >
            Faça login
          </button>
        </span>
      </div>
    </form>
  );
};

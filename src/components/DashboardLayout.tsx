import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Home,
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart3,
  Tag,
  PieChart,
  Target,
  Users,
  Bot,
  ShoppingCart,
  Car,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "./ThemeToggle";
import { useSubscriptionDirect } from "@/hooks/useSubscriptionDirect";
import { AccessStatusIndicator } from "@/components/AccessStatusIndicator";
import { useAuth } from "@/hooks/useAuth";
interface DashboardLayoutProps {
  children: React.ReactNode;
}
export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { subscriptionData } = useSubscriptionDirect();
  const { signOut, user, ensureUserProfile } = useAuth();

  // Garantir que o perfil existe quando o usuário acessa o dashboard
  useEffect(() => {
    const createProfileIfNeeded = async () => {
      if (user && user.email) {
        try {
          console.log("🔄 DashboardLayout - Verificando perfil do usuário...");
          const result = await ensureUserProfile();
          if (result.success) {
            console.log("✅ DashboardLayout - Perfil verificado/criado");
          } else {
            console.warn(
              "⚠️ DashboardLayout - Problema ao criar perfil:",
              result.message
            );
          }
        } catch (error) {
          console.error(
            "❌ DashboardLayout - Erro ao verificar perfil:",
            error
          );
        }
      }
    };

    createProfileIfNeeded();
  }, [user, ensureUserProfile]);
  // Use effective subscription from subscription data
  const isEffectivelySubscribed = subscriptionData.effective_subscription;
  const menuItems = [
    {
      icon: Home,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: TrendingUp,
      label: "Receitas",
      path: "/receitas",
    },
    {
      icon: TrendingDown,
      label: "Despesas",
      path: "/despesas",
    },
    {
      icon: FileText,
      label: "Transações",
      path: "/transacoes",
    },
    {
      icon: PieChart,
      label: "Dívidas",
      path: "/dividas",
    },
    {
      icon: Tag,
      label: "Categorias",
      path: "/categorias",
    },
    {
      icon: BarChart3,
      label: "Relatórios",
      path: "/relatorios",
    },
    {
      icon: Target,
      label: "Metas",
      path: "/metas",
    },
    {
      icon: ShoppingCart,
      label: "Mercado",
      path: "/mercado",
    },
    {
      icon: Car,
      label: "Veículos",
      path: "/veiculos",
    },
    {
      icon: Users,
      label: "Perfil",
      path: "/perfil",
    },
    {
      icon: Bot,
      label: "IA",
      path: "/ia",
    },
  ];
  const handleLogout = async () => {
    try {
      // Use Supabase signOut
      await signOut();

      // Limpar dados adicionais do localStorage se necessário
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("isAuthenticated");

      // Mostrar toast de confirmação
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });

      // Redirecionar para a página inicial (login)
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao desconectar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = "5587991977700"; // Número com código do país
    const message =
      "Olá! Gostaria de acessar o Assistente Financeiro do Meu Dinheiro.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Indicador de Status de Acesso */}
      <AccessStatusIndicator />
      {/* Mobile Menu Button - Only show when menu is closed */}
      {!isMobileMenuOpen && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 bg-white shadow-md rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-screen
          ${
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
          transition-all duration-300
          bg-card border-r border-border flex flex-col
          z-40
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg p-1">
                  <img
                    src="/lovable-uploads/b9870db5-5510-4f26-a060-487dcd4bac35.png"
                    alt="Meu Dinheiro"
                    className="h-full w-full max-h-20 sm:max-h-24 object-contain"
                  />
                </div>
                {!isCollapsed}
              </div>

              {/* Mobile Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-6 w-6 hover:bg-muted transition-colors"
                onClick={closeMobileMenu}
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            {/* Theme Toggle - Below logo */}
            <div className="">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Collapse Button - Positioned on the edge - Desktop only */}
        <Button
          variant="ghost"
          size="icon"
          className={`
            hidden lg:flex absolute top-6 -right-3
            h-6 w-6 rounded-full bg-card border border-border
            hover:bg-muted hover:border-muted-foreground
            transition-all duration-200 shadow-sm
            items-center justify-center
          `}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              // Se não tem assinatura efetiva (assinatura ativa ou trial válido), apenas permite acesso ao perfil
              const isSubscribed = isEffectivelySubscribed;
              const isProfilePage = item.path === "/perfil";

              if (!isSubscribed && !isProfilePage) {
                return (
                  <div
                    key={item.path}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed ${
                      isCollapsed ? "justify-center" : "space-x-3"
                    }`}
                    title={
                      isCollapsed
                        ? `${item.label} (Requer assinatura)`
                        : "Requer assinatura ativa"
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  } ${isCollapsed ? "justify-center" : "space-x-3"}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* WhatsApp MeuDinheiro */}
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <Button
              variant="ghost"
              className={`w-full text-green-600 hover:text-green-700 hover:bg-green-100/50 ${
                isCollapsed ? "justify-center px-0 py-2" : "justify-center py-2"
              }`}
              onClick={() => {
                handleWhatsAppClick();
                closeMobileMenu();
              }}
              title={isCollapsed ? "WhatsApp MeuDinheiro" : undefined}
            >
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="ml-2 text-sm">WhatsApp MeuDinheiro</span>
                )}
              </div>
            </Button>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <Button
            variant="ghost"
            className={`w-full text-muted-foreground hover:text-foreground ${
              isCollapsed ? "justify-center px-0" : "justify-start"
            }`}
            onClick={() => {
              handleLogout();
              closeMobileMenu();
            }}
            title={isCollapsed ? "Sair" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3">Sair</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        } transition-all duration-300`}
      >
        <div className="lg:hidden h-16"></div>{" "}
        {/* Spacer for mobile menu button */}
        {children}
      </div>
    </div>
  );
};

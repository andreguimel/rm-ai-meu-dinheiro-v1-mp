import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Lock,
  Trash2,
  Users,
  UserPlus,
  Crown,
  Zap,
  Shield,
  Star,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSharedUsers } from "@/hooks/useSharedUsers";
import {
  applyPhoneMask,
  cleanPhoneForStorage,
  formatPhoneBrazil,
} from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { DeleteAccountModal } from "@/components/auth/DeleteAccountModal";
import { SharedUsersModal } from "@/components/SharedUsersModal";
import { SubscriptionManagement } from "@/components/SubscriptionManagement";
import { TrialStatusBanner } from "@/components/TrialStatusBanner";
import { TrialInfo } from "@/components/TrialInfo";

const Perfil = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();
  const { subscriptionData, createCheckout } = useSubscription();

  // Verificar se chegou de um pagamento mock
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mockPayment = urlParams.get("mock_payment");
    const status = urlParams.get("status");

    if (mockPayment === "true" && status === "pending") {
      toast({
        title: "Pagamento Mock Simulado",
        description:
          "Este é um checkout simulado. Configure um token válido do Mercado Pago para funcionalidade real.",
        variant: "destructive",
      });

      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
  });

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showSharedUsersModal, setShowSharedUsersModal] = useState(false);

  const { sharedUsers } = useSharedUsers();

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: user?.email || "",
        phone: profile.telefone || "",
        address: profile.endereco || "",
        avatar: profile.avatar_url || "",
      });
    }
  }, [profile, user]);

  const handleSave = async () => {
    try {
      await updateProfile({
        name: formData.name,
        telefone: cleanPhoneForStorage(formData.phone),
        endereco: formData.address,
      });
      setIsEditing(false);
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: user?.email || "",
        phone: profile.telefone || "",
        address: profile.endereco || "",
        avatar: profile.avatar_url || "",
      });
    }
    setIsEditing(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePhoneChange = (value: string) => {
    const maskedValue = applyPhoneMask(value);
    setFormData({ ...formData, phone: maskedValue });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-muted-foreground dark:text-gray-400">
              Carregando perfil...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Trial Status Banner */}
        <TrialStatusBanner />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold tracking-tight dark:text-gray-200">
                Perfil
              </h2>
            </div>
            <p className="text-muted-foreground dark:text-gray-400">
              Gerencie suas informações pessoais
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informações Pessoais - Primeira linha, ocupa 2 colunas */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-orange-500" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    disabled={!isEditing}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  disabled={!isEditing}
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>Salvar</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Editar</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Avatar e ações - Primeira linha, 1 coluna */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar
                    className="w-24 h-24 cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage src={formData.avatar} />
                    <AvatarFallback>
                      {getInitials(formData.name || "Usuario")}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                    onClick={handleAvatarClick}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <h3 className="text-xl font-semibold">
                  {formData.name || "Usuario"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formData.email}
                </p>
                {formData.phone && (
                  <p className="text-sm text-muted-foreground">
                    {formatPhoneBrazil(formData.phone)}
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <Lock className="w-4 h-4 mr-2" />
                Alterar Senha
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowSharedUsersModal(true)}
              >
                <Users className="w-4 h-4 mr-2" />
                Usuários Compartilhados ({sharedUsers?.length || 0}/3)
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteAccountModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Conta
              </Button>
            </CardContent>
          </Card>

          {/* Status da Assinatura - Segunda linha, ocupa todas as 3 colunas */}
          <Card className="lg:col-span-3 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center">
                <Crown className="w-5 h-5 mr-2 text-orange-500" />
                Seu Plano de Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {subscriptionData?.effective_subscription ? (
                subscriptionData?.subscription_tier === "admin" ? (
                  /* Admin - Visual Especial */
                  <div className="relative bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 text-white p-6">
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <Shield className="w-6 h-6 text-yellow-300" />
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="mb-4 lg:mb-0">
                        <div className="flex items-center mb-2">
                          <Shield className="w-6 h-6 mr-2 text-purple-200" />
                          <h3 className="text-2xl font-bold">
                            Conta Administrativa
                          </h3>
                        </div>
                        <p className="text-purple-100 text-lg mb-2">
                          Acesso Total • Privilégios de Administrador
                        </p>
                        <div className="flex items-center text-purple-100">
                          <Star className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            Controle completo da plataforma
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3"></div>
                    </div>
                  </div>
                ) : (
                  /* Assinatura Ativa Normal */
                  <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 text-white p-6">
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <Crown className="w-6 h-6 text-yellow-300" />
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="mb-4 lg:mb-0">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="w-6 h-6 mr-2 text-green-200" />
                          <h3 className="text-2xl font-bold">
                            Assinatura Ativa
                          </h3>
                        </div>
                        <p className="text-green-100 text-lg mb-2">
                          Plano:{" "}
                          {subscriptionData.subscription_tier || "Premium"}
                        </p>
                        <div className="flex items-center text-green-100">
                          <Shield className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            Acesso completo a todos os recursos
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="secondary"
                          onClick={createCheckout}
                          disabled={loading}
                          className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Gerenciar Assinatura
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                /* Sem Assinatura - Layout Atrativo */
                <div className="relative">
                  {/* Header com gradiente */}
                  <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white p-6">
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <Sparkles className="w-6 h-6 text-yellow-300" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-2 flex items-center">
                        <Zap className="w-6 h-6 mr-2 text-yellow-300" />
                        Desbloqueie Todo o Potencial
                      </h3>
                      <p className="text-orange-100 text-lg">
                        Tenha acesso completo à plataforma mais poderosa de
                        gestão financeira
                      </p>
                    </div>
                  </div>

                  {/* Benefícios */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 border-x border-orange-200">
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center">
                        <div className="bg-orange-100 rounded-full p-2 mr-3">
                          <CheckCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            Relatórios Avançados
                          </p>
                          <p className="text-sm text-gray-600">
                            Insights detalhados
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="bg-orange-100 rounded-full p-2 mr-3">
                          <CheckCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            IA Financeira
                          </p>
                          <p className="text-sm text-gray-600">
                            Análises inteligentes
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="bg-orange-100 rounded-full p-2 mr-3">
                          <CheckCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            Usuários Compartilhados
                          </p>
                          <p className="text-sm text-gray-600">Até 3 pessoas</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="bg-gradient-to-br from-white to-orange-50 p-6 border border-orange-200 rounded-b-lg">
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                      <div className="mb-4 sm:mb-0">
                        <p className="text-gray-600 mb-1">A partir de</p>
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold text-gray-900">
                            R$ 39,90
                          </span>
                          <span className="text-gray-600 ml-1">/mês</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={createCheckout}
                          disabled={loading}
                          size="lg"
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-3 rounded-full transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Carregando...
                            </>
                          ) : (
                            <>
                              <Crown className="w-5 h-5 mr-2" />
                              Assinar Agora
                              <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                      <Shield className="w-4 h-4 mr-1" />
                      Cancele a qualquer momento • Suporte 24/7 • Sem taxas
                      ocultas
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção de Gerenciamento de Assinatura - só aparece para assinantes ou usuários em trial */}
          {subscriptionData.effective_subscription && (
            <SubscriptionManagement />
          )}

          {/* Informações do Trial */}
          <TrialInfo />
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
      />

      <SharedUsersModal
        isOpen={showSharedUsersModal}
        onClose={() => setShowSharedUsersModal(false)}
      />
    </DashboardLayout>
  );
};

export default Perfil;

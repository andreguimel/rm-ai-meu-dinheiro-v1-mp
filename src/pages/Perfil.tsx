import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, Calendar, Camera, Lock, Trash2, Users, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSharedUsers } from "@/hooks/useSharedUsers";
import { applyPhoneMask, cleanPhone, formatPhoneBrazil } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { DeleteAccountModal } from "@/components/auth/DeleteAccountModal";
import { SharedUsersModal } from "@/components/SharedUsersModal";
import { SubscriptionManagement } from "@/components/SubscriptionManagement";

const Perfil = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();
  const { subscriptionData } = useSubscription();

  const trialDaysLeft = (() => {
    try {
      const t = subscriptionData?.trial_end ? new Date(subscriptionData.trial_end).getTime() : 0;
      if (!t) return 0;
      const diff = t - Date.now();
      if (diff <= 0) return 0;
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch (err) {
      return 0;
    }
  })();
  const { sharedUsers, canManageSharedUsers, isAccountOwner } = useSharedUsers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [sharedUsersModalOpen, setSharedUsersModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telefone: "",
    endereco: "",
    avatar: ""
  });

  // Carregar dados do perfil quando disponível
  useEffect(() => {
    if (profile && user) {
      setFormData({
        name: profile.name || "",
        email: user.email || "",
        telefone: formatPhoneBrazil(profile.telefone || ""),
        endereco: profile.endereco || "",
        avatar: profile.avatar_url || ""
      });
    }
  }, [profile, user]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'telefone') {
      // Aplica máscara de telefone brasileiro
      const maskedValue = applyPhoneMask(value);
      setFormData(prev => ({
        ...prev,
        [field]: maskedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
        return;
      }

      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Fazer upload real para Supabase Storage
      const avatarUrl = await uploadAvatar(file);
      
      if (avatarUrl) {
        // Atualizar o estado local para mostrar a nova imagem
        setFormData(prev => ({
          ...prev,
          avatar: avatarUrl
        }));
      }
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    const success = await updateProfile({
      name: formData.name,
      telefone: cleanPhone(formData.telefone),
      endereco: formData.endereco,
      avatar_url: formData.avatar
    });

    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Resetar para dados originais
    if (profile && user) {
      setFormData({
        name: profile.name || "",
        email: user.email || "",
        telefone: formatPhoneBrazil(profile.telefone || ""),
        endereco: profile.endereco || "",
        avatar: profile.avatar_url || ""
      });
    }
  };

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Formatação de data de registro
  const formatRegistrationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-muted-foreground dark:text-gray-400">Carregando perfil...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold tracking-tight dark:text-gray-200">Perfil</h2>
              {subscriptionData?.trial_end && (new Date(subscriptionData.trial_end).getTime() > Date.now()) && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-sm font-medium">
                  Teste{trialDaysLeft > 0 ? ` — ${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia' : 'dias'}` : ''}
                </span>
              )}
            </div>
            <p className="text-muted-foreground dark:text-gray-400">
              Gerencie suas informações pessoais
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Avatar e informações básicas */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-24 h-24 cursor-pointer" onClick={handleAvatarClick}>
                    <AvatarImage src={formData.avatar} />
                    <AvatarFallback>{getInitials(formData.name)}</AvatarFallback>
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
              <CardTitle className="mt-4 dark:text-gray-200">{formData.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{formData.email}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Membro desde {profile ? formatRegistrationDate(profile.created_at) : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{formData.endereco}</span>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de segurança */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2 text-orange-500" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Shared Users Section */}
              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => setSharedUsersModalOpen(true)}
              >
                <Users className="w-4 h-4 mr-3" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Usuários Compartilhados</span>
                  <span className="text-xs text-muted-foreground">
                    {isAccountOwner() 
                      ? `Gerencie o acesso à sua conta (${sharedUsers.length}/3)`
                      : 'Você está usando uma conta compartilhada'
                    }
                  </span>
                </div>
              </Button>

              <Button
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <Lock className="w-4 h-4 mr-3" />
                Alterar Senha
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteAccountModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Excluir Conta
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Gerenciamento de Assinatura */}
        <SubscriptionManagement />

        {/* Informações Pessoais */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2 text-orange-500" />
              Informações Pessoais
            </CardTitle>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
              >
                Editar
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Salvar
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(11) 9 9999-9999"
                  maxLength={16}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
      
      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
      />

      <SharedUsersModal 
        isOpen={sharedUsersModalOpen} 
        onClose={() => setSharedUsersModalOpen(false)} 
      />
    </DashboardLayout>
  );
};

export default Perfil;


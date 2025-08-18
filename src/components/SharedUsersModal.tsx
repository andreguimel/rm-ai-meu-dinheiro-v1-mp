import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Plus, Trash2, Edit, Phone, Mail, UserCheck } from "lucide-react";
import { useSharedUsers } from "@/hooks/useSharedUsers";
import { useToast } from "@/hooks/use-toast";
import { applyPhoneMask, cleanPhone, formatPhoneBrazil } from "@/lib/utils";

interface SharedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SharedUsersModal = ({ isOpen, onClose }: SharedUsersModalProps) => {
  const { sharedUsers, loading, addSharedUser, removeSharedUser, updateSharedUser, remainingSlots, canManageSharedUsers } = useSharedUsers();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    whatsapp: ''
  });

  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.whatsapp.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos antes de adicionar.",
        variant: "destructive",
      });
      return;
    }

    const result = await addSharedUser({
      name: newUser.name,
      whatsapp: cleanPhone(newUser.whatsapp) // Remove formatação antes de salvar
    });
    if (!result.error) {
      setNewUser({ name: '', whatsapp: '' });
      setIsAdding(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: { name: string; whatsapp: string }) => {
    await updateSharedUser(userId, {
      ...updates,
      whatsapp: cleanPhone(updates.whatsapp) // Remove formatação antes de salvar
    });
    setEditingUser(null);
  };

  const handleWhatsAppChange = (value: string) => {
    const maskedValue = applyPhoneMask(value);
    setNewUser({ ...newUser, whatsapp: maskedValue });
  };

  if (!canManageSharedUsers()) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <DialogTitle>Acesso Compartilhado</DialogTitle>
            </div>
          </DialogHeader>
          <div className="text-center py-6">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Você está usando uma conta compartilhada. Apenas o proprietário da conta pode gerenciar usuários compartilhados.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <DialogTitle>Gerenciar Usuários Compartilhados</DialogTitle>
          </div>
          <p className="text-sm text-gray-600">
            Compartilhe o acesso à sua conta com até 3 pessoas
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new user section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Adicionar Novo Usuário</h3>
              <Badge variant="secondary">
                {remainingSlots} vagas restantes
              </Badge>
            </div>

            {!isAdding ? (
              <Button
                onClick={() => setIsAdding(true)}
                disabled={remainingSlots === 0}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Usuário
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={newUser.whatsapp}
                    onChange={(e) => handleWhatsAppChange(e.target.value)}
                    placeholder="(11) 9 9999-9999"
                    maxLength={16}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleAddUser} className="flex-1">
                    Adicionar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setNewUser({ name: '', whatsapp: '' });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Current shared users */}
          <div>
            <h3 className="font-medium mb-4">Usuários Compartilhados ({sharedUsers.length}/3)</h3>
            
            {loading ? (
              <div className="text-center py-4">Carregando...</div>
            ) : sharedUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum usuário compartilhado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sharedUsers.map((user) => (
                  <Card key={user.id} className="p-4">
                    {editingUser === user.id ? (
                      <EditUserForm
                        user={user}
                        onSave={(updates) => handleUpdateUser(user.id, updates)}
                        onCancel={() => setEditingUser(null)}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{user.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{formatPhoneBrazil(user.whatsapp)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Adicionado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Acesso</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover o acesso de {user.name}? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeSharedUser(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface EditUserFormProps {
  user: any;
  onSave: (updates: { name: string; whatsapp: string }) => void;
  onCancel: () => void;
}

const EditUserForm = ({ user, onSave, onCancel }: EditUserFormProps) => {
  const [formData, setFormData] = useState({
    name: user.name,
    whatsapp: formatPhoneBrazil(user.whatsapp) // Formata ao carregar para edição
  });

  const handleSave = () => {
    if (formData.name.trim() && formData.whatsapp.trim()) {
      onSave(formData);
    }
  };

  const handleWhatsAppChange = (value: string) => {
    const maskedValue = applyPhoneMask(value);
    setFormData({ ...formData, whatsapp: maskedValue });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Nome</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <Label>WhatsApp</Label>
        <Input
          value={formData.whatsapp}
          onChange={(e) => handleWhatsAppChange(e.target.value)}
          placeholder="(11) 9 9999-9999"
          maxLength={16}
        />
      </div>
      <div className="flex space-x-2">
        <Button onClick={handleSave} size="sm">
          Salvar
        </Button>
        <Button variant="outline" onClick={onCancel} size="sm">
          Cancelar
        </Button>
      </div>
    </div>
  );
};
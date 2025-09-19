import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter } from "lucide-react";
import { useLembretes } from "@/hooks/useLembretes";
import { LembreteCard } from "@/components/LembreteCard";
import { LembreteForm } from "@/components/LembreteForm";
import { useToast } from "@/hooks/use-toast";
import { Lembrete, NovoLembrete } from "@/hooks/useLembretes";

export const Lembretes = () => {
  const { toast } = useToast();
  const {
    lembretes,
    loading,
    createLembrete,
    updateLembrete,
    marcarComoConcluido,
    desmarcarConcluido,
    deleteLembrete,
    refetch,
    getLembretesProximos,
    getLembretesVencidos,
  } = useLembretes();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [lembreteParaEditar, setLembreteParaEditar] = useState<Lembrete | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleCreateLembrete = async (novoLembrete: NovoLembrete) => {
    try {
      console.log("Dados do lembrete antes de enviar:", novoLembrete);
      await createLembrete(novoLembrete);
      setIsFormOpen(false);
      toast({
        title: "Lembrete criado",
        description: "Seu lembrete foi criado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao criar lembrete:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o lembrete. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateLembrete = async (lembreteAtualizado: NovoLembrete) => {
    if (!lembreteParaEditar) return;
    
    try {
      await updateLembrete(lembreteParaEditar.id, lembreteAtualizado);
      setIsFormOpen(false);
      setLembreteParaEditar(null);
      toast({
        title: "Lembrete atualizado",
        description: "Seu lembrete foi atualizado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lembrete. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleToggleConcluido = async (id: string) => {
    const lembrete = lembretes.find(l => l.id === id);
    if (!lembrete) return;

    try {
      if (lembrete.concluido) {
        await desmarcarConcluido(id);
        toast({
          title: "Lembrete reaberto",
          description: "O lembrete foi marcado como pendente.",
        });
      } else {
        await marcarComoConcluido(id);
        toast({
          title: "Lembrete concluído",
          description: "Parabéns! Você concluiu este lembrete.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do lembrete.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (lembrete: Lembrete) => {
    setLembreteParaEditar(lembrete);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este lembrete?")) return;

    try {
      await deleteLembrete(id);
      toast({
        title: "Lembrete excluído",
        description: "O lembrete foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o lembrete. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleNewLembrete = () => {
    setLembreteParaEditar(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setLembreteParaEditar(null);
  };

  const filteredLembretes = lembretes.filter(lembrete =>
    lembrete.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lembrete.descricao && lembrete.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTabLembretes = () => {
    switch (activeTab) {
      case "pendentes":
        return filteredLembretes.filter(l => !l.concluido);
      case "concluidos":
        return filteredLembretes.filter(l => l.concluido);
      case "vencidos":
        return getLembretesVencidos().filter(l => 
          l.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.descricao && l.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      case "proximos":
        return getLembretesProximos().filter(l => 
          l.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.descricao && l.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      default:
        return filteredLembretes;
    }
  };



  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lembretes</h1>
            <p className="text-muted-foreground">
              Gerencie seus lembretes e nunca mais esqueça de nada importante
            </p>
          </div>
          <Button onClick={handleNewLembrete} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Lembrete
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar lembretes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
            <TabsTrigger value="proximos">Próximos</TabsTrigger>
            <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : getTabLembretes().length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "Nenhum lembrete encontrado com os filtros aplicados."
                    : "Nenhum lembrete encontrado. Crie seu primeiro lembrete!"
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {getTabLembretes().map((lembrete) => (
                  <LembreteCard
                    key={lembrete.id}
                    lembrete={lembrete}
                    onToggleConcluido={handleToggleConcluido}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Form Modal */}
        <LembreteForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={lembreteParaEditar ? handleUpdateLembrete : handleCreateLembrete}
          lembreteParaEditar={lembreteParaEditar}
          isLoading={loading}
        />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Lembretes;
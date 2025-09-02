import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Filter,
  TrendingDown,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSharedUsers } from "@/hooks/useSharedUsers";
import { useCategorias } from "@/hooks/useCategorias";
import { useDespesas } from "@/hooks/useDespesas";
import { EditarDespesaModal } from "@/components/EditarDespesaModal";
import { CategoriaSelect } from "@/components/CategoriaSelect";
import { CreatedByBadge } from "@/components/CreatedByBadge";
import { SharedUserSelector } from "@/components/SharedUserSelector";
import { supabase } from "@/integrations/supabase/client";

interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  tipo: "fixa" | "variavel";
}

const Despesas = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { sharedUsers } = useSharedUsers();
  const { categoriasDespesa } = useCategorias();
  const { despesas, createDespesa, updateDespesa, deleteDespesa } =
    useDespesas();
  const [activeTab, setActiveTab] = useState("lista");

  const [novaDespesa, setNovaDespesa] = useState({
    descricao: "",
    valor: "",
    categoria: "",
    data: "",
    tipo: "variavel" as "fixa" | "variavel",
    created_by_shared_user_id: "", // ID do usuário compartilhado que está criando
  });

  const [filtro, setFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [usuarioFiltro, setUsuarioFiltro] = useState("");

  // Estados para o modal de edição
  const [despesaEditando, setDespesaEditando] = useState<Despesa | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  const adicionarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !novaDespesa.descricao ||
      !novaDespesa.valor ||
      !novaDespesa.categoria ||
      !novaDespesa.data
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const categoria = categoriasDespesa.find(
      (c) => c.nome === novaDespesa.categoria
    );

    if (!categoria) {
      toast({
        title: "Erro",
        description: "Categoria não encontrada",
        variant: "destructive",
      });
      return;
    }

    await createDespesa({
      descricao: novaDespesa.descricao,
      valor: parseFloat(novaDespesa.valor),
      categoria_id: categoria.id,
      data: novaDespesa.data,
      created_by_shared_user_id:
        novaDespesa.created_by_shared_user_id || undefined,
    });

    setNovaDespesa({
      descricao: "",
      valor: "",
      categoria: "",
      data: "",
      tipo: "variavel",
      created_by_shared_user_id: "",
    });

    setActiveTab("lista");
  };

  const handleEditarDespesa = (despesa: any) => {
    const despesaFormatada = {
      id: despesa.id,
      descricao: despesa.descricao,
      valor: despesa.valor,
      categoria: despesa.categorias?.nome || "",
      data: despesa.data,
      tipo: "variavel" as "fixa" | "variavel",
    };
    setDespesaEditando(despesaFormatada);
    setModalEditarAberto(true);
  };

  const handleSalvarEdicao = async (despesaAtualizada: Despesa) => {
    const categoria = categoriasDespesa.find(
      (c) => c.nome === despesaAtualizada.categoria
    );

    await updateDespesa(despesaAtualizada.id, {
      descricao: despesaAtualizada.descricao,
      valor: despesaAtualizada.valor,
      categoria_id: categoria?.id,
      data: despesaAtualizada.data,
    });
  };

  const handleExcluirDespesa = async (id: string) => {
    await deleteDespesa(id);
  };

  // Obter lista de usuários únicos que criaram despesas
  const usuariosUnicos = useMemo(() => {
    const users = [];

    // Adicionar o usuário atual
    if (user && profile) {
      users.push({
        id: user.id,
        name: profile.name || user.email?.split("@")[0] || "Você",
        tipo: "atual",
      });
    }

    // Adicionar usuários compartilhados como opção
    if (sharedUsers) {
      sharedUsers.forEach((sharedUser) => {
        users.push({
          id: sharedUser.id,
          name: sharedUser.name,
          tipo: "compartilhado",
        });
      });
    }

    return users;
  }, [user, profile, sharedUsers]);

  const despesasFiltradas = despesas
    .filter((despesa) => {
      const matchDescricao = despesa.descricao
        .toLowerCase()
        .includes(filtro.toLowerCase());
      const matchCategoria =
        categoriaFiltro === "" || despesa.categorias?.nome === categoriaFiltro;

      // Filtro de usuário: agora usando created_by_shared_user_id quando disponível
      const matchUsuario =
        usuarioFiltro === "" ||
        (usuarioFiltro === user?.id && !despesa.created_by_shared_user_id) ||
        despesa.created_by_shared_user_id === usuarioFiltro;

      return matchDescricao && matchCategoria && matchUsuario;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.data);
      const dateB = new Date(b.created_at || b.data);
      return dateB.getTime() - dateA.getTime();
    });

  const totalDespesas = despesas.reduce(
    (total, despesa) => total + despesa.valor,
    0
  );
  const categorias = categoriasDespesa.map((c) => c.nome);

  const limparFiltros = () => {
    setFiltro("");
    setCategoriaFiltro("");
    setUsuarioFiltro("");
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-200">
              Despesas
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Gerencie seus gastos e despesas
            </p>
          </div>
          <Button
            onClick={() => setActiveTab("adicionar")}
            className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Despesa
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="p-4 md:p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 rounded-full p-2 md:p-3">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Total de Despesas
                </p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-200">
                  R${" "}
                  {totalDespesas.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-2 md:p-3">
                <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Despesas
                </p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-200">
                  {despesas.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 rounded-full p-2 md:p-3">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Categorias
                </p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-200">
                  {categoriasDespesa.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 md:space-y-6"
        >
          <TabsList className="w-full grid grid-cols-2 sm:w-auto sm:inline-flex">
            <TabsTrigger value="lista" className="text-sm">
              Lista de Despesas
            </TabsTrigger>
            <TabsTrigger value="adicionar" className="text-sm">
              Adicionar Despesa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4 md:space-y-6">
            {/* Filtros */}
            <Card className="p-4 md:p-6">
              <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-200 mb-4">
                Filtros
              </h2>
              <div className="flex flex-col space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar despesas..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    id="categoria-filtro"
                    title="Filtrar por categoria"
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Todas as categorias</option>
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                  <select
                    id="usuario-filtro"
                    title="Filtrar por usuário"
                    value={usuarioFiltro}
                    onChange={(e) => setUsuarioFiltro(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Todos os usuários</option>
                    {usuariosUnicos.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    onClick={limparFiltros}
                    className="w-full sm:w-auto"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </Card>

            {/* Tabela de Despesas - Visível apenas em desktop */}
            <div className="hidden md:block">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Criado por</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despesasFiltradas.map((despesa) => (
                      <TableRow key={despesa.id}>
                        <TableCell className="font-medium">
                          {despesa.descricao}
                        </TableCell>
                        <TableCell>
                          {despesa.categorias?.nome || "Sem categoria"}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Despesa
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(
                            despesa.data + "T00:00:00"
                          ).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <CreatedByBadge
                            userId={despesa.user_id}
                            createdBySharedUserId={
                              despesa.created_by_shared_user_id
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          R${" "}
                          {despesa.valor.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditarDespesa(despesa)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="sm:max-w-[425px]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Confirmar exclusão
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a despesa "
                                    {despesa.descricao}"? Esta ação não pode ser
                                    desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleExcluirDespesa(despesa.id)
                                    }
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Visualização Mobile - Cards */}
            <div className="md:hidden space-y-4">
              {despesasFiltradas.length === 0 ? (
                <Card className="p-4">
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    Nenhuma despesa encontrada.
                  </p>
                </Card>
              ) : (
                despesasFiltradas.map((despesa) => (
                  <Card key={despesa.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-200">
                            {despesa.descricao}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {despesa.categorias?.nome || "Sem categoria"}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Despesa
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Data</p>
                          <p className="font-medium">
                            {new Date(
                              despesa.data + "T00:00:00"
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Valor</p>
                          <p className="font-medium text-red-600">
                            R${" "}
                            {despesa.valor.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500 text-xs">Criado por</p>
                          <CreatedByBadge
                            userId={despesa.user_id}
                            createdBySharedUserId={
                              despesa.created_by_shared_user_id
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditarDespesa(despesa)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="sm:max-w-[425px]">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Confirmar exclusão
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a despesa "
                                {despesa.descricao}"? Esta ação não pode ser
                                desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleExcluirDespesa(despesa.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="adicionar">
            <Card className="p-4 md:p-6">
              <form onSubmit={adicionarDespesa} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input
                      id="descricao"
                      placeholder="Ex: Aluguel, Supermercado, Conta de Luz..."
                      value={novaDespesa.descricao}
                      onChange={(e) =>
                        setNovaDespesa({
                          ...novaDespesa,
                          descricao: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={novaDespesa.valor}
                      onChange={(e) =>
                        setNovaDespesa({
                          ...novaDespesa,
                          valor: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria *</Label>
                    <CategoriaSelect
                      tipo="despesa"
                      value={novaDespesa.categoria}
                      onChange={(categoria) =>
                        setNovaDespesa({
                          ...novaDespesa,
                          categoria,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data">Data *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={novaDespesa.data}
                      onChange={(e) =>
                        setNovaDespesa({ ...novaDespesa, data: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Tipo de Despesa</Label>
                    <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tipo"
                          value="fixa"
                          checked={novaDespesa.tipo === "fixa"}
                          onChange={(e) =>
                            setNovaDespesa({
                              ...novaDespesa,
                              tipo: e.target.value as "fixa" | "variavel",
                            })
                          }
                          className="text-orange-600"
                        />
                        <span>Despesa Fixa</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tipo"
                          value="variavel"
                          checked={novaDespesa.tipo === "variavel"}
                          onChange={(e) =>
                            setNovaDespesa({
                              ...novaDespesa,
                              tipo: e.target.value as "fixa" | "variavel",
                            })
                          }
                          className="text-orange-600"
                        />
                        <span>Despesa Variável</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <SharedUserSelector
                      value={novaDespesa.created_by_shared_user_id}
                      onChange={(value) =>
                        setNovaDespesa({
                          ...novaDespesa,
                          created_by_shared_user_id: value,
                        })
                      }
                      label="Quem está registrando esta despesa?"
                      placeholder="Você (conta principal)"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("lista")}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Despesa
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Edição */}
        <EditarDespesaModal
          despesa={despesaEditando}
          isOpen={modalEditarAberto}
          onClose={() => {
            setModalEditarAberto(false);
            setDespesaEditando(null);
          }}
          onSave={handleSalvarEdicao}
        />
      </div>
    </DashboardLayout>
  );
};

export default Despesas;

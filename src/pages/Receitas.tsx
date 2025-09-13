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
  TrendingUp,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCategorias } from "@/hooks/useCategorias";
import { useReceitas } from "@/hooks/useReceitas";
import { useAuth } from "@/hooks/useAuth";
import { useSharedUsers } from "@/hooks/useSharedUsers";
import { useProfile } from "@/hooks/useProfile";
import { EditarReceitaModal } from "@/components/EditarReceitaModal";
import { CategoriaSelect } from "@/components/CategoriaSelect";
import { CreatedByBadge } from "@/components/CreatedByBadge";
import { SharedUserSelector } from "@/components/SharedUserSelector";
import { TrialStatusBanner } from "@/components/TrialStatusBanner";
import { BasicAccessBanner } from "@/components/BasicAccessBanner";
import { IPhoneTableOptimizer } from "@/components/IPhoneTableOptimizer";
import { useBasicAccessControl } from "@/hooks/useBasicAccessControl";
import {
  MultiSelectControls,
  SelectAllCheckbox,
  ItemCheckbox,
} from "@/components/MultiSelectControls";

interface Receita {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  tipo: "fixa" | "variavel";
}

const Receitas = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { sharedUsers } = useSharedUsers();
  const { categoriasReceita } = useCategorias();
  const {
    receitas,
    createReceita,
    updateReceita,
    deleteReceita,
    deleteMultipleReceitas,
  } = useReceitas();
  const { wrapAction } = useBasicAccessControl();
  const [activeTab, setActiveTab] = useState("lista");

  const [novaReceita, setNovaReceita] = useState({
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
  const [receitaEditando, setReceitaEditando] = useState<Receita | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  // Estados para seleção múltipla
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const adicionarReceita = wrapAction(async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !novaReceita.descricao ||
      !novaReceita.valor ||
      !novaReceita.categoria ||
      !novaReceita.data
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const categoria = categoriasReceita.find(
      (c) => c.nome === novaReceita.categoria
    );

    if (!categoria) {
      toast({
        title: "Erro",
        description: "Categoria não encontrada",
        variant: "destructive",
      });
      return;
    }

    await createReceita({
      descricao: novaReceita.descricao,
      valor: parseFloat(novaReceita.valor),
      categoria_id: categoria.id,
      data: novaReceita.data,
      created_by_shared_user_id:
        novaReceita.created_by_shared_user_id || undefined,
    });

    setNovaReceita({
      descricao: "",
      valor: "",
      categoria: "",
      data: "",
      tipo: "variavel",
      created_by_shared_user_id: "",
    });

    setActiveTab("lista");
  }, "adicionar receita");

  const handleEditarReceita = wrapAction((receita: any) => {
    const receitaFormatada = {
      id: receita.id,
      descricao: receita.descricao,
      valor: receita.valor,
      categoria: receita.categorias?.nome || "",
      data: receita.data,
      tipo: "variavel" as "fixa" | "variavel",
    };
    setReceitaEditando(receitaFormatada);
    setModalEditarAberto(true);
  }, "editar receita");

  const handleSalvarEdicao = async (receitaAtualizada: Receita) => {
    const categoria = categoriasReceita.find(
      (c) => c.nome === receitaAtualizada.categoria
    );

    await updateReceita(receitaAtualizada.id, {
      descricao: receitaAtualizada.descricao,
      valor: receitaAtualizada.valor,
      categoria_id: categoria?.id,
      data: receitaAtualizada.data,
    });
  };

  const handleExcluirReceita = wrapAction(async (id: string) => {
    await deleteReceita(id);
  }, "excluir receita");

  // Funções para seleção múltipla
  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length > 0) {
      await deleteMultipleReceitas(selectedIds);
    }
  };

  const receitasFiltradas = receitas
    .filter((receita) => {
      const matchDescricao = receita.descricao
        .toLowerCase()
        .includes(filtro.toLowerCase());
      const matchCategoria =
        categoriaFiltro === "" || receita.categorias?.nome === categoriaFiltro;

      // Filtro de usuário: agora usando created_by_shared_user_id quando disponível
      const matchUsuario =
        usuarioFiltro === "" ||
        (usuarioFiltro === user?.id &&
          receita.user_id === user?.id &&
          !receita.created_by_shared_user_id) ||
        receita.created_by_shared_user_id === usuarioFiltro;

      return matchDescricao && matchCategoria && matchUsuario;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.data);
      const dateB = new Date(b.created_at || b.data);
      return dateB.getTime() - dateA.getTime();
    });

  const totalReceitas = receitas.reduce(
    (total, receita) => total + receita.valor,
    0
  );
  const categorias = categoriasReceita.map((c) => c.nome);

  // Obter lista de usuários únicos que criaram receitas
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

  const limparFiltros = () => {
    setFiltro("");
    setCategoriaFiltro("");
    setUsuarioFiltro("");
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Trial Status Banner */}
        <TrialStatusBanner />

        {/* Basic Access Banner */}
        <BasicAccessBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-200">
              Receitas
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Gerencie suas fontes de renda
            </p>
          </div>
          <Button
            onClick={() => setActiveTab("adicionar")}
            className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Receita
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="p-4 md:p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 rounded-full p-2 md:p-3">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Total de Receitas
                </p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-200">
                  R${" "}
                  {totalReceitas.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-2 md:p-3">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Receitas
                </p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-200">
                  {receitas.length}
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
                  {categoriasReceita.length}
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
              Lista de Receitas
            </TabsTrigger>
            <TabsTrigger value="adicionar" className="text-sm">
              Adicionar Receita
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
                    placeholder="Buscar receitas..."
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

            {/* Controles de seleção múltipla */}
            <MultiSelectControls
              selectedIds={selectedIds}
              onSelectionChange={handleSelectionChange}
              onDeleteSelected={handleDeleteSelected}
              totalItems={receitasFiltradas.length}
              itemType="receita"
            />

            {/* Tabela de Receitas com IPhoneTableOptimizer */}
            <IPhoneTableOptimizer
              data={receitasFiltradas}
              title="Lista de Receitas"
              itemsPerPage={8}
              mobileCardRenderer={(receita, index) => (
                <Card key={receita.id} className="p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                         checked={selectedReceitas.includes(receita.id)}
                         onCheckedChange={() => handleSelectReceita(receita.id)}
                         aria-label={`Selecionar receita ${receita.descricao}`}
                       />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {receita.descricao}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                           {receita.categoria?.nome || "Sem categoria"}
                         </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        R$ {receita.valor.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Receita
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span>
                       {receita.data
                         ? format(new Date(receita.data), "dd/MM/yyyy")
                         : "N/A"}
                     </span>
                     <CreatedByBadge
                       createdBy={receita.created_by}
                       currentUserId={user?.id}
                       sharedUsers={sharedUsers}
                     />
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditarReceita(receita)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="sm:max-w-[425px]">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Confirmar exclusão
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a receita "
                            {receita.descricao}"? Esta ação não pode ser
                            desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                             setReceitaParaExcluir(receita);
                             setDialogExcluirAberto(true);
                           }}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              )}
            >
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <SelectAllCheckbox
                          allIds={receitasFiltradas.map((r) => r.id)}
                          selectedIds={selectedIds}
                          onSelectionChange={handleSelectionChange}
                        />
                      </TableHead>
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
                    {receitasFiltradas.map((receita) => (
                      <TableRow key={receita.id}>
                        <TableCell>
                          <ItemCheckbox
                            id={receita.id}
                            selectedIds={selectedIds}
                            onSelectionChange={handleSelectionChange}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {receita.descricao}
                        </TableCell>
                        <TableCell>
                          {receita.categorias?.nome || "Sem categoria"}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Receita
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(
                            receita.data + "T00:00:00"
                          ).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <CreatedByBadge
                            userId={receita.user_id}
                            createdBySharedUserId={
                              receita.created_by_shared_user_id
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          R${" "}
                          {receita.valor.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                         setReceitaEditando(receita);
                         setModalEditarAberto(true);
                       }}
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
                                    Tem certeza que deseja excluir a receita "
                                    {receita.descricao}"? Esta ação não pode ser
                                    desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleExcluirReceita(receita.id)
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
            </IPhoneTableOptimizer>
          </TabsContent>

          <TabsContent value="adicionar">
            <Card className="p-4 md:p-6">
              <form onSubmit={adicionarReceita} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input
                      id="descricao"
                      placeholder="Ex: Salário, Freelance, Aluguel..."
                      value={novaReceita.descricao}
                      onChange={(e) =>
                        setNovaReceita({
                          ...novaReceita,
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
                      value={novaReceita.valor}
                      onChange={(e) =>
                        setNovaReceita({
                          ...novaReceita,
                          valor: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria *</Label>
                    <CategoriaSelect
                      tipo="receita"
                      value={novaReceita.categoria}
                      onChange={(categoria) =>
                        setNovaReceita({
                          ...novaReceita,
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
                      value={novaReceita.data}
                      onChange={(e) =>
                        setNovaReceita({ ...novaReceita, data: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <SharedUserSelector
                      value={novaReceita.created_by_shared_user_id}
                      onChange={(value) =>
                        setNovaReceita({
                          ...novaReceita,
                          created_by_shared_user_id: value,
                        })
                      }
                      label="Quem está registrando esta receita?"
                      placeholder="Você (conta principal)"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Tipo de Receita</Label>
                    <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tipo"
                          value="fixa"
                          checked={novaReceita.tipo === "fixa"}
                          onChange={(e) =>
                            setNovaReceita({
                              ...novaReceita,
                              tipo: e.target.value as "fixa" | "variavel",
                            })
                          }
                          className="text-orange-600"
                        />
                        <span>Receita Fixa</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="tipo"
                          value="variavel"
                          checked={novaReceita.tipo === "variavel"}
                          onChange={(e) =>
                            setNovaReceita({
                              ...novaReceita,
                              tipo: e.target.value as "fixa" | "variavel",
                            })
                          }
                          className="text-orange-600"
                        />
                        <span>Receita Variável</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 sm:space-x-4">
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
                    Adicionar Receita
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Edição */}
        <EditarReceitaModal
          receita={receitaEditando}
          isOpen={modalEditarAberto}
          onClose={() => {
            setModalEditarAberto(false);
            setReceitaEditando(null);
          }}
          onSave={handleSalvarEdicao}
        />
      </div>
    </DashboardLayout>
  );
};

export default Receitas;

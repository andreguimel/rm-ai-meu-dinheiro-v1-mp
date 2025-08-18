
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCategorias } from "@/hooks/useCategorias";
import { type Divida } from "@/hooks/useDividas";

interface EditarDividaModalProps {
  isOpen: boolean;
  onClose: () => void;
  divida: Divida | null;
  onSave: (dividaEditada: Divida) => void;
}

export const EditarDividaModal = ({ isOpen, onClose, divida, onSave }: EditarDividaModalProps) => {
  const { toast } = useToast();
  const { categoriasDespesa } = useCategorias();
  
  const [descricao, setDescricao] = useState('');
  const [valorParcela, setValorParcela] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [categoria, setCategoria] = useState('');
  const [credor, setCredor] = useState('');
  const [avisosPagamento, setAvisosPagamento] = useState(false);

  useEffect(() => {
    if (divida) {
      setDescricao(divida.descricao || '');
      setValorParcela(divida.valor_parcela?.toString() || '');
      setDataVencimento(divida.data_vencimento || '');
      setCategoria(divida.categorias?.nome || '');
      setCredor(divida.credor || '');
      setAvisosPagamento(divida.aviso_pagamento || false);
    }
  }, [divida]);

  const handleSave = () => {
    if (!descricao || !valorParcela || !dataVencimento || !categoria || !credor) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const valorParcelaNum = parseFloat(valorParcela);

    if (!divida) return;

    const dividaEditada: Divida = {
      ...divida,
      descricao,
      valor_parcela: valorParcelaNum,
      data_vencimento: dataVencimento,
      credor,
      aviso_pagamento: avisosPagamento,
    };

    onSave(dividaEditada);
    onClose();

    toast({
      title: "Sucesso",
      description: "Parcela editada com sucesso!",
    });
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Dívida</DialogTitle>
          <DialogDescription>
            Edite as informações da dívida abaixo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Cartão de crédito"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="credor">Credor *</Label>
            <Input
              id="credor"
              value={credor}
              onChange={(e) => setCredor(e.target.value)}
              placeholder="Ex: Banco ABC"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="valorParcela">Valor da Parcela *</Label>
            <Input
              id="valorParcela"
              type="number"
              value={valorParcela}
              onChange={(e) => setValorParcela(e.target.value)}
              placeholder="0,00"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Selecione uma categoria</option>
              {categoriasDespesa.map(cat => (
                <option key={cat.id} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
            <Input
              id="dataVencimento"
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="avisosPagamento"
                checked={avisosPagamento}
                onChange={(e) => setAvisosPagamento(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <Label htmlFor="avisosPagamento">
                Receber aviso de pagamento um dia antes do vencimento
              </Label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

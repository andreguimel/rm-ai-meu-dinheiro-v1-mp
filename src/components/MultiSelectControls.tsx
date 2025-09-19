import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Trash2, X } from "lucide-react";

interface MultiSelectControlsProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDeleteSelected: () => Promise<void>;
  totalItems: number;
  itemType: "despesa" | "receita" | "divida";
}

export const MultiSelectControls = ({
  selectedIds,
  onSelectionChange,
  onDeleteSelected,
  totalItems,
  itemType,
}: MultiSelectControlsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = () => {
    // Esta função será implementada no componente pai
    // pois precisa ter acesso a todos os IDs
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDeleteSelected();
      handleClearSelection();
    } finally {
      setIsDeleting(false);
    }
  };

  const itemTypeLabel =
    itemType === "despesa"
      ? "despesas"
      : itemType === "receita"
      ? "receitas"
      : "dívidas";
  const selectedCount = selectedIds.length;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-transparent border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-700 font-medium">
            {selectedCount} {itemTypeLabel} selecionada
            {selectedCount !== 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="text-blue-600 hover:text-blue-800 p-1"
          >
            <X className="w-4 h-4" />
            Limpar seleção
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Deletar {selectedCount} {itemTypeLabel}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão múltipla</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir {selectedCount} {itemTypeLabel}{" "}
                  selecionada{selectedCount !== 1 ? "s" : ""}? Esta ação não
                  pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? "Deletando..."
                    : `Deletar ${selectedCount} ${itemTypeLabel}`}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

interface SelectAllCheckboxProps {
  allIds: string[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const SelectAllCheckbox = ({
  allIds,
  selectedIds,
  onSelectionChange,
}: SelectAllCheckboxProps) => {
  const isAllSelected =
    allIds.length > 0 && selectedIds.length === allIds.length;
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < allIds.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

  return (
    <div className="flex items-center">
      <Checkbox
        checked={isAllSelected || isSomeSelected}
        onCheckedChange={handleSelectAll}
        aria-label="Selecionar todos"
      />
      {isSomeSelected && (
        <span className="ml-2 text-xs text-gray-500">
          ({selectedIds.length} de {allIds.length})
        </span>
      )}
    </div>
  );
};

interface ItemCheckboxProps {
  id: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const ItemCheckbox = ({
  id,
  selectedIds,
  onSelectionChange,
}: ItemCheckboxProps) => {
  const isSelected = selectedIds.includes(id);

  const handleToggle = () => {
    if (isSelected) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <Checkbox
      checked={isSelected}
      onCheckedChange={handleToggle}
      aria-label={`Selecionar item ${id}`}
    />
  );
};

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Lembrete, NovoLembrete } from "@/hooks/useLembretes";
import { useCategorias } from "@/hooks/useCategorias";

interface LembreteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lembrete: NovoLembrete) => void;
  lembreteParaEditar?: Lembrete | null;
  isLoading?: boolean;
}

export const LembreteForm = ({
  isOpen,
  onClose,
  onSubmit,
  lembreteParaEditar,
  isLoading = false,
}: LembreteFormProps) => {
  const { categorias } = useCategorias();
  
  const [formData, setFormData] = useState<NovoLembrete>({
    titulo: "",
    descricao: "",
    data_lembrete: "",
    categoria_id: "",
    concluido: false,
  });
  
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("09:00");

  useEffect(() => {
    if (lembreteParaEditar) {
      const dateTimeParts = lembreteParaEditar.data_lembrete.split('T');
      const datePart = dateTimeParts[0];
      const timePart = dateTimeParts[1] ? dateTimeParts[1].substring(0, 5) : "09:00";
      
      setFormData({
        titulo: lembreteParaEditar.titulo,
        descricao: lembreteParaEditar.descricao || "",
        data_lembrete: lembreteParaEditar.data_lembrete,
        categoria_id: lembreteParaEditar.categoria_id || "",
        concluido: lembreteParaEditar.concluido,
      });
      
      // Criar data no fuso horário local para evitar problemas de timezone
      const dateParts = datePart.split('-');
      const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      setSelectedDate(localDate);
      setSelectedTime(timePart);
    } else {
      setFormData({
        titulo: "",
        descricao: "",
        data_lembrete: "",
        categoria_id: "",
        concluido: false,
      });
      setSelectedDate(undefined);
      setSelectedTime("09:00");
    }
  }, [lembreteParaEditar, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.data_lembrete) return;
    
    onSubmit(formData);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      // Garantir que a data seja formatada no fuso horário local para evitar problemas de timezone
      // Criar uma nova data no fuso horário local para evitar conversões UTC
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const formattedDateTime = `${year}-${month}-${day}T${selectedTime}:00`;
      
      console.log("Data selecionada:", date);
      console.log("Data local criada:", localDate);
      console.log("Hora selecionada:", selectedTime);
      console.log("Data e hora formatada para salvar:", formattedDateTime);
      
      setFormData(prev => ({
        ...prev,
        data_lembrete: formattedDateTime
      }));
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDateTime = `${year}-${month}-${day}T${time}:00`;
      
      setFormData(prev => ({
        ...prev,
        data_lembrete: formattedDateTime
      }));
    }
  };

  const handleClose = () => {
    setFormData({
      titulo: "",
      descricao: "",
      data_lembrete: "",
      categoria_id: "",
      concluido: false,
    });
    setSelectedDate(undefined);
    setSelectedTime("09:00");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {lembreteParaEditar ? "Editar Lembrete" : "Novo Lembrete"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Digite o título do lembrete"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição opcional do lembrete"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecionar data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário *</Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria_id">Categoria (opcional)</Label>
            <Select
              value={formData.categoria_id || "none"}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                categoria_id: value === "none" ? "" : value 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma categoria</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoria.cor }}
                      />
                      {categoria.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.titulo.trim() || !formData.data_lembrete}>
              {isLoading ? "Salvando..." : lembreteParaEditar ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
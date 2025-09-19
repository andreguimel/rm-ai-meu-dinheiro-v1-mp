import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, Circle, Trash2, Edit } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lembrete } from "@/hooks/useLembretes";

interface LembreteCardProps {
  lembrete: Lembrete;
  onToggleConcluido: (id: string) => void;
  onEdit: (lembrete: Lembrete) => void;
  onDelete: (id: string) => void;
}

export const LembreteCard = ({ 
  lembrete, 
  onToggleConcluido, 
  onEdit, 
  onDelete 
}: LembreteCardProps) => {
  const agora = new Date();
  // Criar data e hora completas no fuso horário local para evitar problemas de timezone
  const dateTimeParts = lembrete.data_lembrete.split('T');
  const dateParts = dateTimeParts[0].split('-');
  const timeParts = dateTimeParts[1] ? dateTimeParts[1].split(':') : ['00', '00'];
  
  const dataVencimento = new Date(
    parseInt(dateParts[0]), 
    parseInt(dateParts[1]) - 1, 
    parseInt(dateParts[2]),
    parseInt(timeParts[0]),
    parseInt(timeParts[1])
  );
  
  const proximoVencimento = addDays(agora, 3);
  
  const isVencido = isBefore(dataVencimento, agora) && !lembrete.concluido;
  const isProximo = isAfter(dataVencimento, agora) && isBefore(dataVencimento, proximoVencimento) && !lembrete.concluido;
  
  const getStatusBadge = () => {
    if (lembrete.concluido) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Concluído</Badge>;
    }
    if (isVencido) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    if (isProximo) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Próximo</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  const getPriorityColor = () => {
    return 'border-l-blue-500'; // Cor padrão para todos os lembretes
  };

  return (
    <Card className={`border-l-4 ${getPriorityColor()} ${lembrete.concluido ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className={`text-lg ${lembrete.concluido ? 'line-through text-muted-foreground' : ''}`}>
            {lembrete.titulo}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleConcluido(lembrete.id)}
              className="p-1"
            >
              {lembrete.concluido ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {lembrete.descricao && (
          <p className={`text-sm text-muted-foreground mb-3 ${lembrete.concluido ? 'line-through' : ''}`}>
            {lembrete.descricao}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(dataVencimento, "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{format(dataVencimento, "HH:mm", { locale: ptBR })}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {lembrete.categoria && (
              <Badge variant="outline" className="text-xs">
                {lembrete.categoria}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(lembrete)}
              className="p-1"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(lembrete.id)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
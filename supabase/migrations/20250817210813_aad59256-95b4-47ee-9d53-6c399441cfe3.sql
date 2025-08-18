-- Modificar a tabela dividas para adicionar novos campos
ALTER TABLE public.dividas 
ADD COLUMN IF NOT EXISTS valor_parcela numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS dia_vencimento integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS mes_inicio integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS ano_inicio integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
ADD COLUMN IF NOT EXISTS numero_parcela integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS divida_pai_id uuid NULL,
ADD COLUMN IF NOT EXISTS aviso_pagamento boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS pago boolean NOT NULL DEFAULT false;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dividas_divida_pai_id ON public.dividas(divida_pai_id);
CREATE INDEX IF NOT EXISTS idx_dividas_data_vencimento ON public.dividas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_dividas_pago ON public.dividas(pago);

-- Atualizar o trigger para calcular status baseado no campo 'pago'
CREATE OR REPLACE FUNCTION public.update_divida_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Auto-update status based on payment and due date
  IF NEW.pago = true THEN
    NEW.status = 'quitada';
  ELSIF NEW.data_vencimento < CURRENT_DATE AND NEW.pago = false THEN
    NEW.status = 'vencida';
  ELSE
    NEW.status = 'pendente';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Remover trigger antigo se existir e criar novo
DROP TRIGGER IF EXISTS update_divida_status_trigger ON public.dividas;
CREATE TRIGGER update_divida_status_trigger
  BEFORE INSERT OR UPDATE ON public.dividas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_divida_status();
-- Script para criar a tabela de lembretes
-- Execute este script no Supabase SQL Editor

-- Criar tabela lembretes
CREATE TABLE IF NOT EXISTS public.lembretes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_lembrete TIMESTAMPTZ NOT NULL,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    concluido BOOLEAN DEFAULT false,
    notificado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_lembretes_user_id ON public.lembretes(user_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_data_lembrete ON public.lembretes(data_lembrete);
CREATE INDEX IF NOT EXISTS idx_lembretes_concluido ON public.lembretes(concluido);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.lembretes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view own lembretes" 
ON public.lembretes
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own lembretes" 
ON public.lembretes
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own lembretes" 
ON public.lembretes
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own lembretes" 
ON public.lembretes
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lembretes_updated_at 
    BEFORE UPDATE ON public.lembretes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.lembretes IS 'Tabela para armazenar lembretes dos usuários';
COMMENT ON COLUMN public.lembretes.titulo IS 'Título do lembrete';
COMMENT ON COLUMN public.lembretes.descricao IS 'Descrição detalhada do lembrete';
COMMENT ON COLUMN public.lembretes.data_lembrete IS 'Data e hora para o lembrete';
COMMENT ON COLUMN public.lembretes.categoria_id IS 'Categoria do lembrete (opcional)';
COMMENT ON COLUMN public.lembretes.concluido IS 'Se o lembrete foi marcado como concluído';
COMMENT ON COLUMN public.lembretes.notificado IS 'Se o usuário já foi notificado sobre este lembrete';
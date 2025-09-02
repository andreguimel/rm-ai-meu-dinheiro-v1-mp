export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          cor: string | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["categoria_tipo"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["categoria_tipo"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["categoria_tipo"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categorias_mercado: {
        Row: {
          ativa: boolean
          cor: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativa?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativa?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categorias_metas: {
        Row: {
          ativa: boolean
          cor: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativa?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativa?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      despesas: {
        Row: {
          categoria_id: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          data?: string
          descricao: string
          id?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      dividas: {
        Row: {
          ano_inicio: number
          aviso_pagamento: boolean
          categoria_id: string | null
          created_at: string
          credor: string
          data_vencimento: string
          descricao: string
          dia_vencimento: number
          divida_pai_id: string | null
          id: string
          mes_inicio: number
          numero_parcela: number
          pago: boolean
          parcelas: number
          parcelas_pagas: number
          status: string
          updated_at: string
          user_id: string
          valor_pago: number
          valor_parcela: number
          valor_restante: number
          valor_total: number
        }
        Insert: {
          ano_inicio?: number
          aviso_pagamento?: boolean
          categoria_id?: string | null
          created_at?: string
          credor: string
          data_vencimento: string
          descricao: string
          dia_vencimento?: number
          divida_pai_id?: string | null
          id?: string
          mes_inicio?: number
          numero_parcela?: number
          pago?: boolean
          parcelas?: number
          parcelas_pagas?: number
          status?: string
          updated_at?: string
          user_id: string
          valor_pago?: number
          valor_parcela?: number
          valor_restante: number
          valor_total: number
        }
        Update: {
          ano_inicio?: number
          aviso_pagamento?: boolean
          categoria_id?: string | null
          created_at?: string
          credor?: string
          data_vencimento?: string
          descricao?: string
          dia_vencimento?: number
          divida_pai_id?: string | null
          id?: string
          mes_inicio?: number
          numero_parcela?: number
          pago?: boolean
          parcelas?: number
          parcelas_pagas?: number
          status?: string
          updated_at?: string
          user_id?: string
          valor_pago?: number
          valor_parcela?: number
          valor_restante?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "dividas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_analysis_results: {
        Row: {
          categoria: string
          categoria_id: string | null
          confianca: number
          created_at: string
          data: string
          descricao: string
          file_name: string
          id: string
          status: string
          tipo: string
          updated_at: string
          upload_id: string | null
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          categoria_id?: string | null
          confianca: number
          created_at?: string
          data: string
          descricao: string
          file_name: string
          id?: string
          status?: string
          tipo: string
          updated_at?: string
          upload_id?: string | null
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          categoria_id?: string | null
          confianca?: number
          created_at?: string
          data?: string
          descricao?: string
          file_name?: string
          id?: string
          status?: string
          tipo?: string
          updated_at?: string
          upload_id?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "ia_analysis_results_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ia_analysis_results_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "ia_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_configuracoes: {
        Row: {
          api_key: string
          api_key_encrypted: string | null
          created_at: string
          id: string
          modelo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          api_key_encrypted?: string | null
          created_at?: string
          id?: string
          modelo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          api_key_encrypted?: string | null
          created_at?: string
          id?: string
          modelo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ia_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      itens_mercado: {
        Row: {
          categoria_mercado_id: string | null
          created_at: string
          descricao: string
          id: string
          preco_atual: number | null
          quantidade_atual: number
          quantidade_ideal: number
          status: string
          unidade_medida: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria_mercado_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          preco_atual?: number | null
          quantidade_atual?: number
          quantidade_ideal?: number
          status?: string
          unidade_medida?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria_mercado_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          preco_atual?: number | null
          quantidade_atual?: number
          quantidade_ideal?: number
          status?: string
          unidade_medida?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_mercado_categoria_mercado_id_fkey"
            columns: ["categoria_mercado_id"]
            isOneToOne: false
            referencedRelation: "categorias_mercado"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes: {
        Row: {
          created_at: string
          data_proxima: string | null
          data_realizada: string | null
          id: string
          observacoes: string | null
          quilometragem_proxima: number | null
          quilometragem_realizada: number | null
          status: string
          tipo_manutencao_id: string
          updated_at: string
          user_id: string
          veiculo_id: string
        }
        Insert: {
          created_at?: string
          data_proxima?: string | null
          data_realizada?: string | null
          id?: string
          observacoes?: string | null
          quilometragem_proxima?: number | null
          quilometragem_realizada?: number | null
          status?: string
          tipo_manutencao_id: string
          updated_at?: string
          user_id: string
          veiculo_id: string
        }
        Update: {
          created_at?: string
          data_proxima?: string | null
          data_realizada?: string | null
          id?: string
          observacoes?: string | null
          quilometragem_proxima?: number | null
          quilometragem_realizada?: number | null
          status?: string
          tipo_manutencao_id?: string
          updated_at?: string
          user_id?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_tipo_manutencao_id_fkey"
            columns: ["tipo_manutencao_id"]
            isOneToOne: false
            referencedRelation: "tipos_manutencao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          categoria_meta_id: string | null
          created_at: string
          data_inicio: string
          data_limite: string
          descricao: string | null
          id: string
          status: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
          valor_alvo: number
          valor_atual: number
        }
        Insert: {
          categoria_meta_id?: string | null
          created_at?: string
          data_inicio?: string
          data_limite: string
          descricao?: string | null
          id?: string
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
          valor_alvo: number
          valor_atual?: number
        }
        Update: {
          categoria_meta_id?: string | null
          created_at?: string
          data_inicio?: string
          data_limite?: string
          descricao?: string | null
          id?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_categoria_meta_id_fkey"
            columns: ["categoria_meta_id"]
            isOneToOne: false
            referencedRelation: "categorias_metas"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos_mercado: {
        Row: {
          ativo: boolean
          categoria_despesa: string
          created_at: string
          estimativa_gastos: number
          id: string
          mes_referencia: string
          updated_at: string
          user_id: string
          valor_orcamento: number
        }
        Insert: {
          ativo?: boolean
          categoria_despesa?: string
          created_at?: string
          estimativa_gastos?: number
          id?: string
          mes_referencia?: string
          updated_at?: string
          user_id: string
          valor_orcamento?: number
        }
        Update: {
          ativo?: boolean
          categoria_despesa?: string
          created_at?: string
          estimativa_gastos?: number
          id?: string
          mes_referencia?: string
          updated_at?: string
          user_id?: string
          valor_orcamento?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          endereco: string | null
          id: string
          name: string
          organization_name: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          name: string
          organization_name?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          name?: string
          organization_name?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receitas: {
        Row: {
          categoria_id: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          data?: string
          descricao: string
          id?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "receitas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_users: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          owner_user_id: string
          shared_user_id: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          shared_user_id?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          shared_user_id?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          // NOTE: legacy column name. Originally for Stripe customer IDs. Now used to store
          // MercadoPago preapproval IDs (preapproval.id). Keep name for backward compatibility.
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tipos_manutencao: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          intervalo_km: number
          nome: string
          sistema: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          intervalo_km: number
          nome: string
          sistema: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          intervalo_km?: number
          nome?: string
          sistema?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          categoria_id: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          data?: string
          descricao: string
          id?: string
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          ano: string
          combustivel: string | null
          cor: string | null
          created_at: string
          data_aquisicao: string | null
          id: string
          marca: string
          modelo: string
          placa: string | null
          quilometragem: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ano: string
          combustivel?: string | null
          cor?: string | null
          created_at?: string
          data_aquisicao?: string | null
          id?: string
          marca: string
          modelo: string
          placa?: string | null
          quilometragem?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: string
          combustivel?: string | null
          cor?: string | null
          created_at?: string
          data_aquisicao?: string | null
          id?: string
          marca?: string
          modelo?: string
          placa?: string | null
          quilometragem?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      ia_configuracoes_decrypted: {
        Row: {
          api_key: string | null
          created_at: string | null
          id: string | null
          modelo: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_key?: never
          created_at?: string | null
          id?: string | null
          modelo?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_key?: never
          created_at?: string | null
          id?: string | null
          modelo?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrypt_api_key: {
        Args: { encrypted_key: string; user_id: string }
        Returns: string
      }
      delete_user_account: {
        Args: { user_id: string }
        Returns: boolean
      }
      encrypt_api_key: {
        Args: { api_key: string; user_id: string }
        Returns: string
      }
      get_main_account_user_id: {
        Args: { user_id: string }
        Returns: string
      }
      has_account_access: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_admin_by_email: {
        Args: { user_email: string }
        Returns: boolean
      }
    }
    Enums: {
      categoria_tipo: "receita" | "despesa"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categoria_tipo: ["receita", "despesa"],
    },
  },
} as const

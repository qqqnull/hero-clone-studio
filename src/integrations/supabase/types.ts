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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          flag: string | null
          id: string
          is_active: boolean | null
          name: string
          phone_code: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          flag?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone_code?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          flag?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone_code?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          country_id: string | null
          created_at: string | null
          id: string
          phone_number: string | null
          phone_number_id: string | null
          price: number | null
          service_id: string | null
          sms_code: string | null
          sms_content: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string | null
          id?: string
          phone_number?: string | null
          phone_number_id?: string | null
          price?: number | null
          service_id?: string | null
          sms_code?: string | null
          sms_content?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country_id?: string | null
          created_at?: string | null
          id?: string
          phone_number?: string | null
          phone_number_id?: string | null
          price?: number | null
          service_id?: string | null
          sms_code?: string | null
          sms_content?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: false
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_numbers: {
        Row: {
          activated_at: string | null
          country_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          number: string
          price: number | null
          service_id: string | null
          sms_code: string | null
          sms_content: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          country_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          number: string
          price?: number | null
          service_id?: string | null
          sms_code?: string | null
          sms_content?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          country_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          number?: string
          price?: number | null
          service_id?: string | null
          sms_code?: string | null
          sms_content?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_numbers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          balance: number | null
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
          user_id: string
          vip_level: number | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          vip_level?: number | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          vip_level?: number | null
        }
        Relationships: []
      }
      service_prices: {
        Row: {
          country_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          price: number
          service_id: string | null
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          service_id?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          service_id?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_prices_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_prices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          code: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          note: string | null
          order_id: string | null
          payment_address: string | null
          payment_method: string | null
          status: string | null
          tx_hash: string | null
          type: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          payment_address?: string | null
          payment_method?: string | null
          status?: string | null
          tx_hash?: string | null
          type: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          payment_address?: string | null
          payment_method?: string | null
          status?: string | null
          tx_hash?: string | null
          type?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      make_user_admin: { Args: { user_email: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

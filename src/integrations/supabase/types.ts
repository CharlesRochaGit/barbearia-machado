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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          duration_min: number
          id: string
          name: string
          price: number
          service_id: string | null
        }
        Insert: {
          appointment_id: string
          duration_min: number
          id?: string
          name: string
          price: number
          service_id?: string | null
        }
        Update: {
          appointment_id?: string
          duration_min?: number
          id?: string
          name?: string
          price?: number
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_slots: {
        Row: {
          active: boolean
          appointment_id: string
          id: string
          slot_start: string
        }
        Insert: {
          active?: boolean
          appointment_id: string
          id?: string
          slot_start: string
        }
        Update: {
          active?: boolean
          appointment_id?: string
          id?: string
          slot_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_slots_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string
          duration_min: number
          end_at: string
          id: string
          origin: Database["public"]["Enums"]["appointment_origin"]
          phone: string
          reminder_sent: boolean
          start_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          total_price: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name: string
          duration_min: number
          end_at: string
          id?: string
          origin?: Database["public"]["Enums"]["appointment_origin"]
          phone: string
          reminder_sent?: boolean
          start_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          total_price: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          duration_min?: number
          end_at?: string
          id?: string
          origin?: Database["public"]["Enums"]["appointment_origin"]
          phone?: string
          reminder_sent?: boolean
          start_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          reason: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          reason?: string
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          reason?: string
          starts_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          id: string
          is_client: boolean
          last_visit: string | null
          name: string
          phone: string
          visits: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_client?: boolean
          last_visit?: string | null
          name: string
          phone: string
          visits?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_client?: boolean
          last_visit?: string | null
          name?: string
          phone?: string
          visits?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          category: string
          created_at: string
          duration_min: number
          id: string
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          duration_min?: number
          id?: string
          name: string
          price: number
          sort_order?: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          duration_min?: number
          id?: string
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          address: string
          barber_name: string
          closed_weekdays: number[]
          id: number
          name: string
          shifts: Json
          slot_minutes: number
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address?: string
          barber_name?: string
          closed_weekdays?: number[]
          id?: number
          name?: string
          shifts?: Json
          slot_minutes?: number
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          address?: string
          barber_name?: string
          closed_weekdays?: number[]
          id?: number
          name?: string
          shifts?: Json
          slot_minutes?: number
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      create_appointment: {
        Args: {
          p_name: string
          p_origin?: Database["public"]["Enums"]["appointment_origin"]
          p_phone: string
          p_service_ids: string[]
          p_start: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
      appointment_origin: "site" | "whatsapp"
      appointment_status:
        | "pendente"
        | "confirmado"
        | "concluido"
        | "cancelado"
        | "nao_compareceu"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
      appointment_origin: ["site", "whatsapp"],
      appointment_status: [
        "pendente",
        "confirmado",
        "concluido",
        "cancelado",
        "nao_compareceu",
      ],
    },
  },
} as const

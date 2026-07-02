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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attack_modules: {
        Row: {
          color: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          icon?: string | null
          id: string
          name: string
        }
        Update: {
          color?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          descr: string | null
          icon: string | null
          id: string
          module: string | null
          name: string
        }
        Insert: {
          descr?: string | null
          icon?: string | null
          id: string
          module?: string | null
          name: string
        }
        Update: {
          descr?: string | null
          icon?: string | null
          id?: string
          module?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_module_fkey"
            columns: ["module"]
            isOneToOne: false
            referencedRelation: "attack_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      badges_earned: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_earned_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badges_earned_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          id: string
          org_id: string | null
          payload: Json
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          org_id?: string | null
          payload?: Json
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          payload?: Json
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      level1_results: {
        Row: {
          completed_at: string
          details: Json
          id: string
          score: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          details?: Json
          id?: string
          score?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          details?: Json
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level1_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      module_progress: {
        Row: {
          completed_at: string | null
          id: string
          module_id: string
          score: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          module_id: string
          score?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          module_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "attack_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          id: string
          org_id: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number
          created_at?: string
          delta: number
          id?: string
          org_id?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          org_id?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          email: string | null
          full_name: string
          gender: string | null
          id: string
          job_role: string | null
          last_active: string | null
          level: number
          org_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          xp: number
        }
        Insert: {
          age?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          id: string
          job_role?: string | null
          last_active?: string | null
          level?: number
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          xp?: number
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          job_role?: string | null
          last_active?: string | null
          level?: number
          org_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sa_credentials: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          label?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "super_admin" | "org_admin" | "employee"
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
      user_role: ["super_admin", "org_admin", "employee"],
    },
  },
} as const

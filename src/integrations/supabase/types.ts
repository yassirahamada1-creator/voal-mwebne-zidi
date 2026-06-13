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
      contents: {
        Row: {
          created_at: string
          description_fr: string | null
          description_shk: string | null
          duration: number | null
          id: string
          is_published: boolean
          media_url: string | null
          module_slug: string | null
          parent_id: string | null
          thumbnail_url: string | null
          title_fr: string
          title_shk: string
          type: string
        }
        Insert: {
          created_at?: string
          description_fr?: string | null
          description_shk?: string | null
          duration?: number | null
          id?: string
          is_published?: boolean
          media_url?: string | null
          module_slug?: string | null
          parent_id?: string | null
          thumbnail_url?: string | null
          title_fr: string
          title_shk: string
          type: string
        }
        Update: {
          created_at?: string
          description_fr?: string | null
          description_shk?: string | null
          duration?: number | null
          id?: string
          is_published?: boolean
          media_url?: string | null
          module_slug?: string | null
          parent_id?: string | null
          thumbnail_url?: string | null
          title_fr?: string
          title_shk?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contents_module_slug_fkey"
            columns: ["module_slug"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "contents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_items: {
        Row: {
          caption_fr: string | null
          caption_shk: string | null
          created_at: string
          id: string
          image_url: string
          is_published: boolean
          module_slug: string | null
          order_index: number
          updated_at: string
        }
        Insert: {
          caption_fr?: string | null
          caption_shk?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_published?: boolean
          module_slug?: string | null
          order_index?: number
          updated_at?: string
        }
        Update: {
          caption_fr?: string | null
          caption_shk?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_published?: boolean
          module_slug?: string | null
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      hommage_content: {
        Row: {
          birth_date: string
          derniers_mots: string
          derniers_mots_note: string
          display_name: string
          engagement: string
          famille_retient: string
          footer_note: string
          hommage_global: string
          id: string
          invocation_ar: string
          invocation_fr: string
          invocation_translit: string
          is_visible: boolean
          liens: string
          parcours: string
          photo_caption: string
          photo_url: string | null
          subtitle: string
          talents: string
          title: string
          updated_at: string
        }
        Insert: {
          birth_date?: string
          derniers_mots?: string
          derniers_mots_note?: string
          display_name?: string
          engagement?: string
          famille_retient?: string
          footer_note?: string
          hommage_global?: string
          id?: string
          invocation_ar?: string
          invocation_fr?: string
          invocation_translit?: string
          is_visible?: boolean
          liens?: string
          parcours?: string
          photo_caption?: string
          photo_url?: string | null
          subtitle?: string
          talents?: string
          title?: string
          updated_at?: string
        }
        Update: {
          birth_date?: string
          derniers_mots?: string
          derniers_mots_note?: string
          display_name?: string
          engagement?: string
          famille_retient?: string
          footer_note?: string
          hommage_global?: string
          id?: string
          invocation_ar?: string
          invocation_fr?: string
          invocation_translit?: string
          is_visible?: boolean
          liens?: string
          parcours?: string
          photo_caption?: string
          photo_url?: string | null
          subtitle?: string
          talents?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description_fr: string | null
          description_shk: string | null
          id: string
          is_active: boolean
          name_fr: string
          name_shk: string
          order_index: number
          slug: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description_fr?: string | null
          description_shk?: string | null
          id?: string
          is_active?: boolean
          name_fr: string
          name_shk: string
          order_index?: number
          slug: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description_fr?: string | null
          description_shk?: string | null
          id?: string
          is_active?: boolean
          name_fr?: string
          name_shk?: string
          order_index?: number
          slug?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation_fr: string | null
          explanation_shk: string | null
          id: string
          is_published: boolean
          module_slug: string | null
          option_a_fr: string
          option_a_shk: string
          option_b_fr: string
          option_b_shk: string
          option_c_fr: string | null
          option_c_shk: string | null
          option_d_fr: string | null
          option_d_shk: string | null
          order_index: number
          question_fr: string
          question_shk: string
          updated_at: string
        }
        Insert: {
          correct_index?: number
          created_at?: string
          explanation_fr?: string | null
          explanation_shk?: string | null
          id?: string
          is_published?: boolean
          module_slug?: string | null
          option_a_fr: string
          option_a_shk: string
          option_b_fr: string
          option_b_shk: string
          option_c_fr?: string | null
          option_c_shk?: string | null
          option_d_fr?: string | null
          option_d_shk?: string | null
          order_index?: number
          question_fr: string
          question_shk: string
          updated_at?: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation_fr?: string | null
          explanation_shk?: string | null
          id?: string
          is_published?: boolean
          module_slug?: string | null
          option_a_fr?: string
          option_a_shk?: string
          option_b_fr?: string
          option_b_shk?: string
          option_c_fr?: string | null
          option_c_shk?: string | null
          option_d_fr?: string | null
          option_d_shk?: string | null
          order_index?: number
          question_fr?: string
          question_shk?: string
          updated_at?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          id: string
          key: string
          screen: string | null
          updated_at: string
          value_fr: string
          value_shk: string
        }
        Insert: {
          id?: string
          key: string
          screen?: string | null
          updated_at?: string
          value_fr: string
          value_shk: string
        }
        Update: {
          id?: string
          key?: string
          screen?: string | null
          updated_at?: string
          value_fr?: string
          value_shk?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
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
      app_role: ["admin", "editor", "viewer"],
    },
  },
} as const

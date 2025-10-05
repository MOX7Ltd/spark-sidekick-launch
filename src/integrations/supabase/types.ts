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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string | null
          id: number
          kind: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          kind?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          kind?: string | null
          user_id?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          audience: string | null
          bio: string | null
          brand_colors: Json | null
          business_name: string | null
          created_at: string | null
          experience: string | null
          id: string
          idea: string | null
          logo_svg: string | null
          naming_preference: string | null
          owner_id: string
          session_id: string | null
          status: string | null
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          audience?: string | null
          bio?: string | null
          brand_colors?: Json | null
          business_name?: string | null
          created_at?: string | null
          experience?: string | null
          id?: string
          idea?: string | null
          logo_svg?: string | null
          naming_preference?: string | null
          owner_id: string
          session_id?: string | null
          status?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          audience?: string | null
          bio?: string | null
          brand_colors?: Json | null
          business_name?: string | null
          created_at?: string | null
          experience?: string | null
          id?: string
          idea?: string | null
          logo_svg?: string | null
          naming_preference?: string | null
          owner_id?: string
          session_id?: string | null
          status?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          end_at: string | null
          id: string
          location_url: string | null
          price: number | null
          product_id: string | null
          start_at: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_at?: string | null
          id?: string
          location_url?: string | null
          price?: number | null
          product_id?: string | null
          start_at: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_at?: string | null
          id?: string
          location_url?: string | null
          price?: number | null
          product_id?: string | null
          start_at?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaign_items: {
        Row: {
          campaign_id: string
          caption: string | null
          created_at: string | null
          hashtags: string[] | null
          hook: string | null
          id: string
          platform: string | null
          posted_at: string | null
          scheduled_at: string | null
        }
        Insert: {
          campaign_id: string
          caption?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          platform?: string | null
          posted_at?: string | null
          scheduled_at?: string | null
        }
        Update: {
          campaign_id?: string
          caption?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          platform?: string | null
          posted_at?: string | null
          scheduled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          name: string | null
          objective: string | null
          session_id: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          name?: string | null
          objective?: string | null
          session_id?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          name?: string | null
          objective?: string | null
          session_id?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          action: string
          created_at: string
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          id: number
          ok: boolean
          payload_keys: string[] | null
          provider: string | null
          session_id: string
          step: string
          trace_id: string
        }
        Insert: {
          action: string
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: never
          ok: boolean
          payload_keys?: string[] | null
          provider?: string | null
          session_id: string
          step: string
          trace_id: string
        }
        Update: {
          action?: string
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: never
          ok?: boolean
          payload_keys?: string[] | null
          provider?: string | null
          session_id?: string
          step?: string
          trace_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean
          key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      idempotent_responses: {
        Row: {
          created_at: string
          fn: string
          idempotency_key: string
          request_hash: string
          response: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          fn: string
          idempotency_key: string
          request_hash: string
          response: Json
          session_id: string
        }
        Update: {
          created_at?: string
          fn?: string
          idempotency_key?: string
          request_hash?: string
          response?: Json
          session_id?: string
        }
        Relationships: []
      }
      marketing_posts: {
        Row: {
          created_at: string
          hashtags: string[] | null
          id: string
          image_url: string | null
          platform: string
          post_text: string
          prompt: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform: string
          post_text: string
          prompt?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform?: string
          post_text?: string
          prompt?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      message_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          subject: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          from_email: string | null
          from_name: string | null
          id: string
          is_from_customer: boolean
          product_id: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_from_customer?: boolean
          product_id?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_from_customer?: boolean
          product_id?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          business_id: string | null
          created_at: string | null
          description: string | null
          format: string | null
          id: string
          price: number | null
          session_id: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          visible: boolean | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          format?: string | null
          id?: string
          price?: number | null
          session_id?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          visible?: boolean | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          format?: string | null
          id?: string
          price?: number | null
          session_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          last_active_at: string | null
          starter_pack_shared: boolean
          timezone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          last_active_at?: string | null
          starter_pack_shared?: boolean
          timezone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          last_active_at?: string | null
          starter_pack_shared?: boolean
          timezone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_hidden: boolean
          product_id: string
          rating: number | null
          reply: string | null
          reviewer_name: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          product_id: string
          rating?: number | null
          reply?: string | null
          reviewer_name?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          product_id?: string
          rating?: number | null
          reply?: string | null
          reviewer_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_idempotent_responses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

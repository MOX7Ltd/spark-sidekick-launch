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
      analytics_events: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          type: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          type: string
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          business_id: string
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          end_time: string
          id: string
          notes: string | null
          start_time: string
          status: string | null
          title: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          status?: string | null
          title?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          business_id: string
          created_at: string | null
          end_time: string
          id: string
          start_time: string
          weekday: number
        }
        Insert: {
          business_id: string
          created_at?: string | null
          end_time: string
          id?: string
          start_time: string
          weekday: number
        }
        Update: {
          business_id?: string
          created_at?: string | null
          end_time?: string
          id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          audience: string | null
          bio: string | null
          brand_colors: Json | null
          business_name: string | null
          created_at: string | null
          experience: string | null
          handle: string | null
          id: string
          idea: string | null
          logo_svg: string | null
          logo_url: string | null
          naming_preference: string | null
          owner_id: string | null
          session_id: string | null
          starter_paid: boolean | null
          status: string | null
          stripe_account_id: string | null
          stripe_onboarded: boolean | null
          tagline: string | null
          tone_tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          audience?: string | null
          bio?: string | null
          brand_colors?: Json | null
          business_name?: string | null
          created_at?: string | null
          experience?: string | null
          handle?: string | null
          id?: string
          idea?: string | null
          logo_svg?: string | null
          logo_url?: string | null
          naming_preference?: string | null
          owner_id?: string | null
          session_id?: string | null
          starter_paid?: boolean | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_onboarded?: boolean | null
          tagline?: string | null
          tone_tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          audience?: string | null
          bio?: string | null
          brand_colors?: Json | null
          business_name?: string | null
          created_at?: string | null
          experience?: string | null
          handle?: string | null
          id?: string
          idea?: string | null
          logo_svg?: string | null
          logo_url?: string | null
          naming_preference?: string | null
          owner_id?: string | null
          session_id?: string | null
          starter_paid?: boolean | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_onboarded?: boolean | null
          tagline?: string | null
          tone_tags?: string[] | null
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
          meta: Json | null
          platform: string | null
          posted_at: string | null
          scheduled_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          caption?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          meta?: Json | null
          platform?: string | null
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          caption?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          meta?: Json | null
          platform?: string | null
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string | null
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
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          name_snapshot: string
          option_id: string | null
          price_cents_snapshot: number
          product_id: string
          qty: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          name_snapshot: string
          option_id?: string | null
          price_cents_snapshot?: number
          product_id: string
          qty?: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          name_snapshot?: string
          option_id?: string | null
          price_cents_snapshot?: number
          product_id?: string
          qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          anon_id: string | null
          business_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anon_id?: string | null
          business_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anon_id?: string | null
          business_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      customer_message_replies: {
        Row: {
          attachments: Json | null
          body: string
          created_at: string | null
          id: string
          message_id: string
          sender_id: string | null
          sender_type: string
          via: string | null
        }
        Insert: {
          attachments?: Json | null
          body: string
          created_at?: string | null
          id?: string
          message_id: string
          sender_id?: string | null
          sender_type: string
          via?: string | null
        }
        Update: {
          attachments?: Json | null
          body?: string
          created_at?: string | null
          id?: string
          message_id?: string
          sender_id?: string | null
          sender_type?: string
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_message_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "customer_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_messages: {
        Row: {
          business_id: string
          created_at: string | null
          customer_email: string
          customer_name: string | null
          id: string
          last_message_at: string | null
          product_id: string | null
          status: string | null
          topic: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          customer_email: string
          customer_name?: string | null
          id?: string
          last_message_at?: string | null
          product_id?: string | null
          status?: string | null
          topic?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          customer_email?: string
          customer_name?: string | null
          id?: string
          last_message_at?: string | null
          product_id?: string | null
          status?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      ideas: {
        Row: {
          created_at: string | null
          id: string
          ideas_json: Json
          input_text: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ideas_json: Json
          input_text: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ideas_json?: Json
          input_text?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      onboarding_sessions: {
        Row: {
          created_at: string
          id: string
          migrated_at: string | null
          migrated_to_user_id: string | null
          payload: Json
          session_id: string
          user_hint_email: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          migrated_at?: string | null
          migrated_to_user_id?: string | null
          payload: Json
          session_id: string
          user_hint_email?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          migrated_at?: string | null
          migrated_to_user_id?: string | null
          payload?: Json
          session_id?: string
          user_hint_email?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_total: number
          business_id: string
          created_at: string | null
          currency: string | null
          customer_email: string | null
          fee_amount: number | null
          id: string
          net_amount: number | null
          payment_method: string | null
          platform_fee: number | null
          product_id: string | null
          quantity: number | null
          status: string | null
          stripe_payment_intent: string | null
        }
        Insert: {
          amount_total: number
          business_id: string
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          fee_amount?: number | null
          id?: string
          net_amount?: number | null
          payment_method?: string | null
          platform_fee?: number | null
          product_id?: string | null
          quantity?: number | null
          status?: string | null
          stripe_payment_intent?: string | null
        }
        Update: {
          amount_total?: number
          business_id?: string
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          fee_amount?: number | null
          id?: string
          net_amount?: number | null
          payment_method?: string | null
          platform_fee?: number | null
          product_id?: string | null
          quantity?: number | null
          status?: string | null
          stripe_payment_intent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_assets: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          meta: Json | null
          product_id: string
          storage_path: string
          type: string
          version: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          meta?: Json | null
          product_id: string
          storage_path: string
          type: string
          version: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          meta?: Json | null
          product_id?: string
          storage_path?: string
          type?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_assets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          asset_status: string | null
          asset_type: string | null
          asset_url: string | null
          asset_version: number | null
          business_id: string | null
          created_at: string | null
          description: string | null
          format: string | null
          fulfillment: Json | null
          generation_source: string | null
          id: string
          is_draft: boolean | null
          legacy_pdf_url: string | null
          price: number | null
          session_id: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string | null
          visible: boolean | null
        }
        Insert: {
          asset_status?: string | null
          asset_type?: string | null
          asset_url?: string | null
          asset_version?: number | null
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          format?: string | null
          fulfillment?: Json | null
          generation_source?: string | null
          id?: string
          is_draft?: boolean | null
          legacy_pdf_url?: string | null
          price?: number | null
          session_id?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          visible?: boolean | null
        }
        Update: {
          asset_status?: string | null
          asset_type?: string | null
          asset_url?: string | null
          asset_version?: number | null
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          format?: string | null
          fulfillment?: Json | null
          generation_source?: string | null
          id?: string
          is_draft?: boolean | null
          legacy_pdf_url?: string | null
          price?: number | null
          session_id?: string | null
          status?: string | null
          title?: string
          type?: string | null
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
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
          stripe_customer_id: string | null
          subscription_current_period_end: string | null
          subscription_status: string | null
          timezone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          last_active_at?: string | null
          starter_pack_shared?: boolean
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: string | null
          timezone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          last_active_at?: string | null
          starter_pack_shared?: boolean
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: string | null
          timezone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          business_id: string | null
          comment: string | null
          created_at: string
          customer_email: string | null
          id: string
          is_hidden: boolean
          product_id: string | null
          rating: number | null
          reply: string | null
          reviewer_name: string | null
          status: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          business_id?: string | null
          comment?: string | null
          created_at?: string
          customer_email?: string | null
          id?: string
          is_hidden?: boolean
          product_id?: string | null
          rating?: number | null
          reply?: string | null
          reviewer_name?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          business_id?: string | null
          comment?: string | null
          created_at?: string
          customer_email?: string | null
          id?: string
          is_hidden?: boolean
          product_id?: string | null
          rating?: number | null
          reply?: string | null
          reviewer_name?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      shopfront_settings: {
        Row: {
          announcement_text: string | null
          business_id: string
          draft: Json | null
          layout: Json | null
          published: Json | null
          published_at: string | null
          reviews_summary: Json | null
          show_announcement: boolean | null
          theme: Json | null
        }
        Insert: {
          announcement_text?: string | null
          business_id: string
          draft?: Json | null
          layout?: Json | null
          published?: Json | null
          published_at?: string | null
          reviews_summary?: Json | null
          show_announcement?: boolean | null
          theme?: Json | null
        }
        Update: {
          announcement_text?: string | null
          business_id?: string
          draft?: Json | null
          layout?: Json | null
          published?: Json | null
          published_at?: string | null
          reviews_summary?: Json | null
          show_announcement?: boolean | null
          theme?: Json | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          business_id: string | null
          caption: string | null
          clicks: number | null
          conversions: number | null
          created_at: string | null
          id: string
          impressions: number | null
          platform: string | null
          posted_at: string | null
        }
        Insert: {
          business_id?: string | null
          caption?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          impressions?: number | null
          platform?: string | null
          posted_at?: string | null
        }
        Update: {
          business_id?: string | null
          caption?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          id?: string
          impressions?: number | null
          platform?: string | null
          posted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          created_at: string
          data: Json
          id: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_summary: {
        Args: { bid: string }
        Returns: Json
      }
      cleanup_old_idempotent_responses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      compute_business_rating: {
        Args: { bid: string }
        Returns: Json
      }
      sales_summary: {
        Args: { bid: string }
        Returns: Json
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

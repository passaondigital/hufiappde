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
      addon_purchases: {
        Row: {
          addon_key: string
          addon_type: string
          amount: number
          created_at: string
          id: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          addon_key: string
          addon_type: string
          amount: number
          created_at?: string
          id?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          addon_key?: string
          addon_type?: string
          amount?: number
          created_at?: string
          id?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          created_at: string
          id: string
          model: string
          tokens_in: number
          tokens_out: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string
          tokens_in?: number
          tokens_out?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          tokens_in?: number
          tokens_out?: number
          user_id?: string
        }
        Relationships: []
      }
      app_features: {
        Row: {
          badge: string | null
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          date: string
          horse_id: string | null
          id: string
          notes: string | null
          time: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          horse_id?: string | null
          id?: string
          notes?: string | null
          time?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          horse_id?: string | null
          id?: string
          notes?: string | null
          time?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_strategies: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          priority: string | null
          source: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          priority?: string | null
          source?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          priority?: string | null
          source?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_horses: {
        Row: {
          customer_id: string
          horse_id: string
          id: string
        }
        Insert: {
          customer_id: string
          horse_id: string
          id?: string
        }
        Update: {
          customer_id?: string
          horse_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_horses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_horses_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      ecosystem_links: {
        Row: {
          app_key: string
          connected_at: string | null
          data_sharing_enabled: boolean | null
          external_id: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_key: string
          connected_at?: string | null
          data_sharing_enabled?: boolean | null
          external_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_key?: string
          connected_at?: string | null
          data_sharing_enabled?: boolean | null
          external_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      horses: {
        Row: {
          age: number | null
          breed: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          notes: string | null
          updated_at: string
          use_type: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          breed?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          use_type?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          breed?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          use_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      knowledge_vault: {
        Row: {
          category: string
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      llm_providers: {
        Row: {
          api_endpoint: string | null
          api_key_secret_name: string
          cost_per_1m_input: number | null
          cost_per_1m_output: number | null
          created_at: string
          id: string
          is_active: boolean | null
          model_name: string
          name: string
          priority: number | null
          provider: string
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_secret_name: string
          cost_per_1m_input?: number | null
          cost_per_1m_output?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          model_name: string
          name: string
          priority?: number | null
          provider: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_secret_name?: string
          cost_per_1m_input?: number | null
          cost_per_1m_output?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          model_name?: string
          name?: string
          priority?: number | null
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_logs: {
        Row: {
          created_at: string
          findings: string | null
          horse_id: string | null
          id: string
          log_type: string
          measurements: Json | null
          source: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          findings?: string | null
          horse_id?: string | null
          id?: string
          log_type?: string
          measurements?: Json | null
          source?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          findings?: string | null
          horse_id?: string | null
          id?: string
          log_type?: string
          measurements?: Json | null
          source?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_logs_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      motion_analyses: {
        Row: {
          ai_note: string | null
          beat_clarity: number
          beat_desc: string | null
          created_at: string
          frame_image_url: string | null
          horse_name: string | null
          id: string
          lameness_desc: string | null
          lameness_index: number
          owner_name: string | null
          symmetry_desc: string | null
          symmetry_score: number
          user_id: string
        }
        Insert: {
          ai_note?: string | null
          beat_clarity: number
          beat_desc?: string | null
          created_at?: string
          frame_image_url?: string | null
          horse_name?: string | null
          id?: string
          lameness_desc?: string | null
          lameness_index: number
          owner_name?: string | null
          symmetry_desc?: string | null
          symmetry_score: number
          user_id: string
        }
        Update: {
          ai_note?: string | null
          beat_clarity?: number
          beat_desc?: string | null
          created_at?: string
          frame_image_url?: string | null
          horse_name?: string | null
          id?: string
          lameness_desc?: string | null
          lameness_index?: number
          owner_name?: string | null
          symmetry_desc?: string | null
          symmetry_score?: number
          user_id?: string
        }
        Relationships: []
      }
      mvp_question_responses: {
        Row: {
          created_at: string
          id: string
          question_key: string
          response_rating: number | null
          response_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_key: string
          response_rating?: number | null
          response_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_key?: string
          response_rating?: number | null
          response_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          category: string | null
          content: string
          created_at: string
          horse_id: string | null
          id: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          horse_id?: string | null
          id?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          horse_id?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          connect_code: string | null
          created_at: string
          display_name: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          onboarding_completed: boolean | null
          referral_code: string | null
          updated_at: string
          user_id: string
          user_type: string | null
          vault_password_hash: string | null
          webauthn_credential_id: string | null
        }
        Insert: {
          connect_code?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          onboarding_completed?: boolean | null
          referral_code?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
          vault_password_hash?: string | null
          webauthn_credential_id?: string | null
        }
        Update: {
          connect_code?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          onboarding_completed?: boolean | null
          referral_code?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
          vault_password_hash?: string | null
          webauthn_credential_id?: string | null
        }
        Relationships: []
      }
      projects_master: {
        Row: {
          assets_list: Json
          created_at: string
          id: string
          last_logic_update: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assets_list?: Json
          created_at?: string
          id?: string
          last_logic_update?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assets_list?: Json
          created_at?: string
          id?: string
          last_logic_update?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_horses: {
        Row: {
          created_at: string
          horse_id: string
          id: string
          owner_id: string
          shared_with_id: string
        }
        Insert: {
          created_at?: string
          horse_id: string
          id?: string
          owner_id: string
          shared_with_id: string
        }
        Update: {
          created_at?: string
          horse_id?: string
          id?: string
          owner_id?: string
          shared_with_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_horses_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_balances: {
        Row: {
          ai_tokens_remaining: number
          created_at: string
          id: string
          storage_extra_gb: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_tokens_remaining?: number
          created_at?: string
          id?: string
          storage_extra_gb?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_tokens_remaining?: number
          created_at?: string
          id?: string
          storage_extra_gb?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          admin_response: string | null
          category: string
          content: string
          context: string | null
          created_at: string
          id: string
          priority: string | null
          rating: number | null
          status: string
          subcategory: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string
          content: string
          context?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          rating?: number | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          content?: string
          context?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          rating?: number | null
          status?: string
          subcategory?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_profile: {
        Row: {
          created_at: string
          favorite_topics: string[] | null
          id: string
          input_count: number
          last_input_at: string | null
          patterns: Json
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_topics?: string[] | null
          id?: string
          input_count?: number
          last_input_at?: string | null
          patterns?: Json
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_topics?: string[] | null
          id?: string
          input_count?: number
          last_input_at?: string | null
          patterns?: Json
          preferences?: Json
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_subscriptions: {
        Row: {
          ai_requests_reset_date: string
          ai_requests_today: number
          created_at: string
          id: string
          is_active: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_requests_reset_date?: string
          ai_requests_today?: number
          created_at?: string
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_requests_reset_date?: string
          ai_requests_today?: number
          created_at?: string
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vault_documents: {
        Row: {
          category: string | null
          created_at: string
          file_size: number | null
          file_type: string | null
          file_url: string
          horse_id: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          horse_id?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          horse_id?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_documents_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_usage_log: {
        Row: {
          agent_id: string | null
          created_at: string
          duration_seconds: number
          id: string
          routing_result: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          duration_seconds?: number
          id?: string
          routing_result?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          duration_seconds?: number
          id?: string
          routing_result?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_ai_limit: { Args: { p_user_id: string }; Returns: Json }
      credit_storage: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      credit_tokens: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
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
      app_role: "admin" | "user"
      subscription_plan: "free" | "premium"
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
      app_role: ["admin", "user"],
      subscription_plan: ["free", "premium"],
    },
  },
} as const

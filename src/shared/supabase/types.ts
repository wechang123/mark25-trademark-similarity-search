export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_analysis_results: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          model_used: string | null
          parsed_result: Json | null
          probability: number | null
          processing_time_ms: number | null
          prompt_used: string | null
          raw_response: string | null
          token_usage: Json | null
          trademark_search_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          model_used?: string | null
          parsed_result?: Json | null
          probability?: number | null
          processing_time_ms?: number | null
          prompt_used?: string | null
          raw_response?: string | null
          token_usage?: Json | null
          trademark_search_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          model_used?: string | null
          parsed_result?: Json | null
          probability?: number | null
          processing_time_ms?: number | null
          prompt_used?: string | null
          raw_response?: string | null
          token_usage?: Json | null
          trademark_search_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_results_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "latest_search_ids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_results_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_sessions: {
        Row: {
          completed_at: string | null
          confidence: number | null
          created_at: string
          error_message: string | null
          id: string
          model_used: string | null
          parsed_result: Json | null
          probability: number | null
          processing_time_ms: number | null
          prompt_used: string | null
          raw_response: string | null
          recommendations: string[] | null
          risk_factors: string[] | null
          risk_level: string | null
          risk_score: number | null
          session_status: string
          session_type: string
          token_usage: Json | null
          trademark_search_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          model_used?: string | null
          parsed_result?: Json | null
          probability?: number | null
          processing_time_ms?: number | null
          prompt_used?: string | null
          raw_response?: string | null
          recommendations?: string[] | null
          risk_factors?: string[] | null
          risk_level?: string | null
          risk_score?: number | null
          session_status?: string
          session_type: string
          token_usage?: Json | null
          trademark_search_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          model_used?: string | null
          parsed_result?: Json | null
          probability?: number | null
          processing_time_ms?: number | null
          prompt_used?: string | null
          raw_response?: string | null
          recommendations?: string[] | null
          risk_factors?: string[] | null
          risk_level?: string | null
          risk_score?: number | null
          session_status?: string
          session_type?: string
          token_usage?: Json | null
          trademark_search_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_sessions_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "latest_search_ids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_sessions_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string
          status: string | null
          trademark_name: string
          trademark_search_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone: string
          status?: string | null
          trademark_name: string
          trademark_search_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string
          status?: string | null
          trademark_name?: string
          trademark_search_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_waitlist_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "latest_search_ids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_waitlist_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          provider: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          provider?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          provider?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      kipris_search_results: {
        Row: {
          created_at: string | null
          id: string
          processed_data: Json | null
          raw_data: Json | null
          risk_level: string | null
          risk_score: number | null
          same_industry_count: number | null
          search_query: string | null
          search_timestamp: string | null
          total_found: number | null
          trademark_search_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          processed_data?: Json | null
          raw_data?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          same_industry_count?: number | null
          search_query?: string | null
          search_timestamp?: string | null
          total_found?: number | null
          trademark_search_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          processed_data?: Json | null
          raw_data?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          same_industry_count?: number | null
          search_query?: string | null
          search_timestamp?: string | null
          total_found?: number | null
          trademark_search_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kipris_search_results_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "latest_search_ids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kipris_search_results_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      product_classifications: {
        Row: {
          class_code: number
          created_at: string
          id: number
          product_name: string
          similarity_group_code: string
        }
        Insert: {
          class_code: number
          created_at?: string
          id?: number
          product_name: string
          similarity_group_code: string
        }
        Update: {
          class_code?: number
          created_at?: string
          id?: number
          product_name?: string
          similarity_group_code?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          marketing_agreed: boolean | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          marketing_agreed?: boolean | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          marketing_agreed?: boolean | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_pre_bookings: {
        Row: {
          created_at: string | null
          email: string
          id: string
          source: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          source: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          source?: string
          status?: string | null
        }
        Relationships: []
      }
      similar_trademarks: {
        Row: {
          applicant_name: string | null
          application_date: string | null
          created_at: string | null
          goods_classification_code: string | null
          id: string
          kipris_application_number: string | null
          phonetic_similarity: number | null
          registration_date: string | null
          registration_number: string | null
          risk_level: string | null
          semantic_similarity: number | null
          similarity_score: number | null
          trademark_name: string
          trademark_search_id: string | null
          trademark_status: string | null
          visual_similarity: number | null
        }
        Insert: {
          applicant_name?: string | null
          application_date?: string | null
          created_at?: string | null
          goods_classification_code?: string | null
          id?: string
          kipris_application_number?: string | null
          phonetic_similarity?: number | null
          registration_date?: string | null
          registration_number?: string | null
          risk_level?: string | null
          semantic_similarity?: number | null
          similarity_score?: number | null
          trademark_name: string
          trademark_search_id?: string | null
          trademark_status?: string | null
          visual_similarity?: number | null
        }
        Update: {
          applicant_name?: string | null
          application_date?: string | null
          created_at?: string | null
          goods_classification_code?: string | null
          id?: string
          kipris_application_number?: string | null
          phonetic_similarity?: number | null
          registration_date?: string | null
          registration_number?: string | null
          risk_level?: string | null
          semantic_similarity?: number | null
          similarity_score?: number | null
          trademark_name?: string
          trademark_search_id?: string | null
          trademark_status?: string | null
          visual_similarity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "similar_trademarks_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "latest_search_ids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "similar_trademarks_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          connected_at: string | null
          id: string
          provider: string
          provider_data: Json | null
          provider_email: string | null
          provider_user_id: string
          user_id: string | null
        }
        Insert: {
          connected_at?: string | null
          id?: string
          provider: string
          provider_data?: Json | null
          provider_email?: string | null
          provider_user_id: string
          user_id?: string | null
        }
        Update: {
          connected_at?: string | null
          id?: string
          provider?: string
          provider_data?: Json | null
          provider_email?: string | null
          provider_user_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rejection_notices: {
        Row: {
          id: string
          session_id: string | null
          similar_trademark_id: string | null
          application_number: string
          decision_number: string | null
          doc_name: string | null
          rejection_reason: string | null
          rejection_reason_summary: string | null
          legal_ground: string | null
          pdf_file_url: string | null
          rejection_date: string | null
          raw_text: string | null
          extracted_summary: string | null
          key_phrases: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          similar_trademark_id?: string | null
          application_number: string
          decision_number?: string | null
          doc_name?: string | null
          rejection_reason?: string | null
          rejection_reason_summary?: string | null
          legal_ground?: string | null
          pdf_file_url?: string | null
          rejection_date?: string | null
          raw_text?: string | null
          extracted_summary?: string | null
          key_phrases?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          similar_trademark_id?: string | null
          application_number?: string
          decision_number?: string | null
          doc_name?: string | null
          rejection_reason?: string | null
          rejection_reason_summary?: string | null
          legal_ground?: string | null
          pdf_file_url?: string | null
          rejection_date?: string | null
          raw_text?: string | null
          extracted_summary?: string | null
          key_phrases?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trademark_applications: {
        Row: {
          address: string
          address_auto_change: boolean
          address_detail: string
          address_english: string | null
          address_postal_code: string
          applicant_type: string
          application_number: string | null
          city_province: string
          created_at: string | null
          delivery_address: string | null
          delivery_address_detail: string | null
          electronic_certificate: boolean
          email: string
          id: string
          industry_description: string
          name_english: string
          name_korean: string
          nationality: string
          patent_customer_number: string | null
          payment_status: string
          pcn_issuance_status: string
          pcn_last_checked_at: string | null
          phone_number: string
          publication_address_method: string | null
          receipt_method: string
          resident_number: string
          resident_registration_file_url: string
          seal_image_url: string | null
          signature_image_url: string | null
          single_application_possible: boolean | null
          status: string | null
          trademark_image_url: string
          trademark_registration_status: string
          trademark_type: string
          updated_at: string | null
        }
        Insert: {
          address: string
          address_auto_change: boolean
          address_detail: string
          address_english?: string | null
          address_postal_code: string
          applicant_type: string
          application_number?: string | null
          city_province: string
          created_at?: string | null
          delivery_address?: string | null
          delivery_address_detail?: string | null
          electronic_certificate: boolean
          email: string
          id?: string
          industry_description: string
          name_english: string
          name_korean: string
          nationality: string
          patent_customer_number?: string | null
          payment_status?: string
          pcn_issuance_status?: string
          pcn_last_checked_at?: string | null
          phone_number: string
          publication_address_method?: string | null
          receipt_method: string
          resident_number: string
          resident_registration_file_url: string
          seal_image_url?: string | null
          signature_image_url?: string | null
          single_application_possible?: boolean | null
          status?: string | null
          trademark_image_url: string
          trademark_registration_status?: string
          trademark_type?: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          address_auto_change?: boolean
          address_detail?: string
          address_english?: string | null
          address_postal_code?: string
          applicant_type?: string
          application_number?: string | null
          city_province?: string
          created_at?: string | null
          delivery_address?: string | null
          delivery_address_detail?: string | null
          electronic_certificate?: boolean
          email?: string
          id?: string
          industry_description?: string
          name_english?: string
          name_korean?: string
          nationality?: string
          patent_customer_number?: string | null
          payment_status?: string
          pcn_issuance_status?: string
          pcn_last_checked_at?: string | null
          phone_number?: string
          publication_address_method?: string | null
          receipt_method?: string
          resident_number?: string
          resident_registration_file_url?: string
          seal_image_url?: string | null
          signature_image_url?: string | null
          single_application_possible?: boolean | null
          status?: string | null
          trademark_image_url?: string
          trademark_registration_status?: string
          trademark_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trademark_classifications: {
        Row: {
          created_at: string
          description: string | null
          designated_products: string[] | null
          figure_code: string | null
          goods_classification_code: string | null
          goods_classifications: string | null
          id: string
          industry: string | null
          product_classification_codes: string[] | null
          similar_group_codes: string[] | null
          trademark_search_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          designated_products?: string[] | null
          figure_code?: string | null
          goods_classification_code?: string | null
          goods_classifications?: string | null
          id?: string
          industry?: string | null
          product_classification_codes?: string[] | null
          similar_group_codes?: string[] | null
          trademark_search_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          designated_products?: string[] | null
          figure_code?: string | null
          goods_classification_code?: string | null
          goods_classifications?: string | null
          id?: string
          industry?: string | null
          product_classification_codes?: string[] | null
          similar_group_codes?: string[] | null
          trademark_search_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trademark_classifications_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "latest_search_ids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trademark_classifications_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      trademark_searches: {
        Row: {
          ai_analysis: Json | null
          analysis_results: Json | null
          business_description: string | null
          completed_at: string | null
          conversation_history: Json | null
          created_at: string | null
          current_question_type: string | null
          current_step: string | null
          description: string | null
          designated_products: string[] | null
          device_info: Json | null
          expert_analysis: Json | null
          expert_analysis_completed_at: string | null
          figure_code: string | null
          goods_classification_code: string | null
          goods_classifications: string | null
          id: string
          industry: string | null
          langgraph_state: Json | null
          product_classification_codes: string[] | null
          progress: number | null
          recommendations: string[] | null
          results: Json | null
          risk_factors: string[] | null
          risk_level: string | null
          risk_score: number | null
          similar_group_codes: string[] | null
          similar_trademarks: Json | null
          status: string | null
          trademark: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          analysis_results?: Json | null
          business_description?: string | null
          completed_at?: string | null
          conversation_history?: Json | null
          created_at?: string | null
          current_question_type?: string | null
          current_step?: string | null
          description?: string | null
          designated_products?: string[] | null
          device_info?: Json | null
          expert_analysis?: Json | null
          expert_analysis_completed_at?: string | null
          figure_code?: string | null
          goods_classification_code?: string | null
          goods_classifications?: string | null
          id?: string
          industry?: string | null
          langgraph_state?: Json | null
          product_classification_codes?: string[] | null
          progress?: number | null
          recommendations?: string[] | null
          results?: Json | null
          risk_factors?: string[] | null
          risk_level?: string | null
          risk_score?: number | null
          similar_group_codes?: string[] | null
          similar_trademarks?: Json | null
          status?: string | null
          trademark: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          analysis_results?: Json | null
          business_description?: string | null
          completed_at?: string | null
          conversation_history?: Json | null
          created_at?: string | null
          current_question_type?: string | null
          current_step?: string | null
          description?: string | null
          designated_products?: string[] | null
          device_info?: Json | null
          expert_analysis?: Json | null
          expert_analysis_completed_at?: string | null
          figure_code?: string | null
          goods_classification_code?: string | null
          goods_classifications?: string | null
          id?: string
          industry?: string | null
          langgraph_state?: Json | null
          product_classification_codes?: string[] | null
          progress?: number | null
          recommendations?: string[] | null
          results?: Json | null
          risk_factors?: string[] | null
          risk_level?: string | null
          risk_score?: number | null
          similar_group_codes?: string[] | null
          similar_trademarks?: Json | null
          status?: string | null
          trademark?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trademark_workflows: {
        Row: {
          conversation_history: Json
          created_at: string
          current_question_type: string | null
          current_step: string
          id: string
          langgraph_state: Json
          trademark_search_id: string
          updated_at: string
          workflow_status: string
        }
        Insert: {
          conversation_history?: Json
          created_at?: string
          current_question_type?: string | null
          current_step?: string
          id?: string
          langgraph_state?: Json
          trademark_search_id: string
          updated_at?: string
          workflow_status?: string
        }
        Update: {
          conversation_history?: Json
          created_at?: string
          current_question_type?: string | null
          current_step?: string
          id?: string
          langgraph_state?: Json
          trademark_search_id?: string
          updated_at?: string
          workflow_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "trademark_workflows_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "latest_search_ids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trademark_workflows_trademark_search_id_fkey"
            columns: ["trademark_search_id"]
            isOneToOne: false
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      duplicate_search_groups: {
        Row: {
          business_description: string | null
          duplicate_count: number | null
          first_created: string | null
          last_created: string | null
          trademark: string | null
        }
        Relationships: []
      }
      duplicate_search_summary: {
        Row: {
          avg_time_between_duplicates: number | null
          business_description: string | null
          first_request: string | null
          last_request: string | null
          total_requests: number | null
          trademark: string | null
        }
        Relationships: []
      }
      duplicate_trademark_searches: {
        Row: {
          business_description: string | null
          duplicate_count: number | null
          first_created: string | null
          keep_id: string | null
          last_created: string | null
          trademark: string | null
        }
        Relationships: []
      }
      latest_search_ids: {
        Row: {
          business_description: string | null
          id: string | null
          keep_id: string | null
          trademark: string | null
        }
        Relationships: []
      }
      security_dashboard: {
        Row: {
          failed_events: number | null
          last_hour_events: number | null
          last_hour_failures: number | null
          today_events: number | null
          today_failures: number | null
          total_auth_events: number | null
          unique_ips: number | null
          unique_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_auth_log: {
        Args: {
          user_id: string
          event_type: string
          provider_name?: string
          ip_address?: unknown
          user_agent?: string
          metadata?: Json
        }
        Returns: string
      }
      generate_voucher_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_profile_by_email: {
        Args: { user_email: string }
        Returns: {
          id: string
          email: string
          name: string
          phone: string
          avatar_url: string
          marketing_agreed: boolean
          role: string
          created_at: string
          updated_at: string
        }[]
      }
      get_security_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          active_users: number
          deleted_users: number
          email_users: number
          social_users: number
        }[]
      }
      link_social_account: {
        Args: {
          user_id: string
          provider_name: string
          provider_user_id: string
          provider_email?: string
          provider_data?: Json
        }
        Returns: string
      }
      migrate_ai_analysis_to_json: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_similar_products: {
        Args: {
          search_query: string
          target_class_code: number
          result_limit: number
        }
        Returns: {
          id: number
          class_code: number
          similarity_group_code: string
          product_name: string
          created_at: string
          similarity: number
        }[]
      }
      soft_delete_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      unlink_social_account: {
        Args: { user_id: string; provider_name: string }
        Returns: boolean
      }
      update_search_progress: {
        Args:
          | {
              search_id: string
              new_status: string
              new_progress?: number
              new_results?: Json
            }
          | {
              search_id: string
              new_status: string
              new_progress?: number
              new_results?: Json
              new_product_codes?: string[]
              new_similar_codes?: string[]
              new_designated_products?: string[]
            }
        Returns: boolean
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

// Additional type exports for new normalized tables
export type TrademarkWorkflow = Tables<'trademark_workflows'>
export type TrademarkClassification = Tables<'trademark_classifications'>  
export type AnalysisSession = Tables<'analysis_sessions'>

export type TrademarkWorkflowInsert = TablesInsert<'trademark_workflows'>
export type TrademarkClassificationInsert = TablesInsert<'trademark_classifications'>
export type AnalysisSessionInsert = TablesInsert<'analysis_sessions'>

export type SessionType = 'ai_analysis' | 'expert_analysis' | 'workflow_analysis' | 'risk_analysis'
export type SessionStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type WorkflowStatus = 'active' | 'paused' | 'completed' | 'failed'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
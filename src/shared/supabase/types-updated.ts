export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  ai_analysis: {
    Tables: {
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
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          }
        ]
      }
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
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          }
        ]
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
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  trademark: {
    Tables: {
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
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          }
        ]
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
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          }
        ]
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
            referencedRelation: "trademark_searches"
            referencedColumns: ["id"]
          }
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  user_management: {
    Tables: {
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
          role?: string | null
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
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
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
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

// 기본 타입 유틸리티 (미사용)
// export type Tables<
//   Schema extends keyof DatabaseWithoutInternals,
//   TableName extends keyof DatabaseWithoutInternals[Schema]["Tables"]
// > = DatabaseWithoutInternals[Schema]["Tables"][TableName]["Row"]

// export type TablesInsert<
//   Schema extends keyof DatabaseWithoutInternals,
//   TableName extends keyof DatabaseWithoutInternals[Schema]["Tables"]
// > = DatabaseWithoutInternals[Schema]["Tables"][TableName]["Insert"]

// export type TablesUpdate<
//   Schema extends keyof DatabaseWithoutInternals,
//   TableName extends keyof DatabaseWithoutInternals[Schema]["Tables"]
// > = DatabaseWithoutInternals[Schema]["Tables"][TableName]["Update"]

// Schema-specific type exports - 스키마 키로 직접 접근
export type TrademarkTables = Database['trademark']['Tables']
export type AIAnalysisTables = Database['ai_analysis']['Tables']
export type UserManagementTables = Database['user_management']['Tables']
export type PublicTables = Database['public']['Tables']

// Specific table types - 직접 접근 방식으로 수정
export type TrademarkSearch = Database['trademark']['Tables']['trademark_searches']['Row']
export type TrademarkWorkflow = Database['trademark']['Tables']['trademark_workflows']['Row']
export type TrademarkClassification = Database['trademark']['Tables']['trademark_classifications']['Row']
export type KiprisSearchResult = Database['trademark']['Tables']['kipris_search_results']['Row']
export type TrademarkApplication = Database['trademark']['Tables']['trademark_applications']['Row']

export type AnalysisSession = Database['ai_analysis']['Tables']['analysis_sessions']['Row']
export type AIAnalysisResult = Database['ai_analysis']['Tables']['ai_analysis_results']['Row']
export type SimilarTrademark = Database['ai_analysis']['Tables']['similar_trademarks']['Row']

export type Profile = Database['user_management']['Tables']['profiles']['Row']
export type SocialAccount = Database['user_management']['Tables']['social_accounts']['Row']
export type AuthLog = Database['user_management']['Tables']['auth_logs']['Row']

export type AnalysisWaitlist = Database['public']['Tables']['analysis_waitlist']['Row']
export type ProductClassification = Database['public']['Tables']['product_classifications']['Row']
export type ServicePreBooking = Database['public']['Tables']['service_pre_bookings']['Row']

// Insert types - 직접 접근 방식으로 수정
export type TrademarkSearchInsert = Database['trademark']['Tables']['trademark_searches']['Insert']
export type AnalysisSessionInsert = Database['ai_analysis']['Tables']['analysis_sessions']['Insert']
export type ProfileInsert = Database['user_management']['Tables']['profiles']['Insert']

// Common enums
export type SessionType = 'ai_analysis' | 'expert_analysis' | 'workflow_analysis' | 'risk_analysis'
export type SessionStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type WorkflowStatus = 'active' | 'paused' | 'completed' | 'failed'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
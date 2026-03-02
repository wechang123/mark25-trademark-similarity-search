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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      analysis_sessions: {
        Row: {
          business_description: string | null
          completed_at: string | null
          created_at: string
          designated_products: string[] | null
          id: string
          image_file_data: string | null
          image_url: string | null
          product_classification_codes: number[] | null
          progress: number | null
          similar_group_codes: string[] | null
          status: string | null
          trademark_name: string
          trademark_type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_description?: string | null
          completed_at?: string | null
          created_at?: string
          designated_products?: string[] | null
          id?: string
          image_file_data?: string | null
          image_url?: string | null
          product_classification_codes?: number[] | null
          progress?: number | null
          similar_group_codes?: string[] | null
          status?: string | null
          trademark_name: string
          trademark_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_description?: string | null
          completed_at?: string | null
          created_at?: string
          designated_products?: string[] | null
          id?: string
          image_file_data?: string | null
          image_url?: string | null
          product_classification_codes?: number[] | null
          progress?: number | null
          similar_group_codes?: string[] | null
          status?: string | null
          trademark_name?: string
          trademark_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analysis_waitlist_backup: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          phone: string | null
          status: string | null
          trademark_basic_info_id: string | null
          trademark_name: string | null
          trademark_search_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
          status?: string | null
          trademark_basic_info_id?: string | null
          trademark_name?: string | null
          trademark_search_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
          phone?: string | null
          status?: string | null
          trademark_basic_info_id?: string | null
          trademark_name?: string | null
          trademark_search_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          question: string | null
          question_type: string | null
          session_id: string | null
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          question?: string | null
          question_type?: string | null
          session_id?: string | null
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          question?: string | null
          question_type?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_queries: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          processing_time_ms: number | null
          query_text: string
          query_type: string
          response_data: Json | null
          response_summary: string | null
          session_id: string | null
          source_documents: string[] | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          processing_time_ms?: number | null
          query_text: string
          query_type: string
          response_data?: Json | null
          response_summary?: string | null
          session_id?: string | null
          source_documents?: string[] | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          processing_time_ms?: number | null
          query_text?: string
          query_type?: string
          response_data?: Json | null
          response_summary?: string | null
          session_id?: string | null
          source_documents?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_queries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      final_results: {
        Row: {
          ai_confidence: number | null
          created_at: string
          expert_analysis_summary: string | null
          expert_recommendations: string[] | null
          id: string
          key_findings: string[] | null
          legal_risks: string[] | null
          registration_probability: number | null
          report_data: Json | null
          report_id: string | null
          risk_level: string | null
          session_id: string | null
          strategic_recommendations: string[] | null
        }
        Insert: {
          ai_confidence?: number | null
          created_at?: string
          expert_analysis_summary?: string | null
          expert_recommendations?: string[] | null
          id?: string
          key_findings?: string[] | null
          legal_risks?: string[] | null
          registration_probability?: number | null
          report_data?: Json | null
          report_id?: string | null
          risk_level?: string | null
          session_id?: string | null
          strategic_recommendations?: string[] | null
        }
        Update: {
          ai_confidence?: number | null
          created_at?: string
          expert_analysis_summary?: string | null
          expert_recommendations?: string[] | null
          id?: string
          key_findings?: string[] | null
          legal_risks?: string[] | null
          registration_probability?: number | null
          report_data?: Json | null
          report_id?: string | null
          risk_level?: string | null
          session_id?: string | null
          strategic_recommendations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "final_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      information_checklist: {
        Row: {
          analysis_ready: boolean | null
          basic_info_collected: boolean | null
          business_type_collected: boolean | null
          collected_responses: Json | null
          collection_progress: number | null
          competitors_collected: boolean | null
          created_at: string
          id: string
          previous_trademarks_collected: boolean | null
          product_details_collected: boolean | null
          session_id: string | null
          target_market_collected: boolean | null
          trademark_purpose_collected: boolean | null
          updated_at: string
        }
        Insert: {
          analysis_ready?: boolean | null
          basic_info_collected?: boolean | null
          business_type_collected?: boolean | null
          collected_responses?: Json | null
          collection_progress?: number | null
          competitors_collected?: boolean | null
          created_at?: string
          id?: string
          previous_trademarks_collected?: boolean | null
          product_details_collected?: boolean | null
          session_id?: string | null
          target_market_collected?: boolean | null
          trademark_purpose_collected?: boolean | null
          updated_at?: string
        }
        Update: {
          analysis_ready?: boolean | null
          basic_info_collected?: boolean | null
          business_type_collected?: boolean | null
          collected_responses?: Json | null
          collection_progress?: number | null
          competitors_collected?: boolean | null
          created_at?: string
          id?: string
          previous_trademarks_collected?: boolean | null
          product_details_collected?: boolean | null
          session_id?: string | null
          target_market_collected?: boolean | null
          trademark_purpose_collected?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "information_checklist_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      kipris_searches: {
        Row: {
          classification_codes: number[] | null
          created_at: string
          id: string
          risk_level: string | null
          risk_score: number | null
          same_industry_count: number | null
          search_results: Json | null
          search_success: boolean | null
          search_type: string
          session_id: string | null
          total_results: number | null
          trademark_query: string
        }
        Insert: {
          classification_codes?: number[] | null
          created_at?: string
          id?: string
          risk_level?: string | null
          risk_score?: number | null
          same_industry_count?: number | null
          search_results?: Json | null
          search_success?: boolean | null
          search_type: string
          session_id?: string | null
          total_results?: number | null
          trademark_query: string
        }
        Update: {
          classification_codes?: number[] | null
          created_at?: string
          id?: string
          risk_level?: string | null
          risk_score?: number | null
          same_industry_count?: number | null
          search_results?: Json | null
          search_success?: boolean | null
          search_type?: string
          session_id?: string | null
          total_results?: number | null
          trademark_query?: string
        }
        Relationships: [
          {
            foreignKeyName: "kipris_searches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      kipris_similarity_codes: {
        Row: {
          application_number: string
          cached_at: string
          class_code: string | null
          similar_group_codes: string[]
          source: string | null
          trademark_title: string | null
          updated_at: string
        }
        Insert: {
          application_number: string
          cached_at?: string
          class_code?: string | null
          similar_group_codes: string[]
          source?: string | null
          trademark_title?: string | null
          updated_at?: string
        }
        Update: {
          application_number?: string
          cached_at?: string
          class_code?: string | null
          similar_group_codes?: string[]
          source?: string | null
          trademark_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pending_confirmations: {
        Row: {
          confirmation_data: Json | null
          confirmation_type: string
          created_at: string
          id: string
          responded_at: string | null
          session_id: string | null
          status: string | null
          user_response: string | null
        }
        Insert: {
          confirmation_data?: Json | null
          confirmation_type: string
          created_at?: string
          id?: string
          responded_at?: string | null
          session_id?: string | null
          status?: string | null
          user_response?: string | null
        }
        Update: {
          confirmation_data?: Json | null
          confirmation_type?: string
          created_at?: string
          id?: string
          responded_at?: string | null
          session_id?: string | null
          status?: string | null
          user_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_confirmations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
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
      rejection_notices: {
        Row: {
          application_number: string
          created_at: string
          decision_number: string | null
          doc_name: string
          extracted_summary: string | null
          id: string
          key_phrases: Json | null
          legal_ground: string | null
          pdf_file_url: string | null
          raw_text: string | null
          rejection_date: string | null
          rejection_reason: string | null
          rejection_reason_summary: string | null
          session_id: string | null
          similar_trademark_id: string | null
          updated_at: string
        }
        Insert: {
          application_number: string
          created_at?: string
          decision_number?: string | null
          doc_name?: string
          extracted_summary?: string | null
          id?: string
          key_phrases?: Json | null
          legal_ground?: string | null
          pdf_file_url?: string | null
          raw_text?: string | null
          rejection_date?: string | null
          rejection_reason?: string | null
          rejection_reason_summary?: string | null
          session_id?: string | null
          similar_trademark_id?: string | null
          updated_at?: string
        }
        Update: {
          application_number?: string
          created_at?: string
          decision_number?: string | null
          doc_name?: string
          extracted_summary?: string | null
          id?: string
          key_phrases?: Json | null
          legal_ground?: string | null
          pdf_file_url?: string | null
          raw_text?: string | null
          rejection_date?: string | null
          rejection_reason?: string | null
          rejection_reason_summary?: string | null
          session_id?: string | null
          similar_trademark_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rejection_notices_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rejection_notices_similar_trademark_id_fkey"
            columns: ["similar_trademark_id"]
            isOneToOne: false
            referencedRelation: "similar_trademarks"
            referencedColumns: ["id"]
          },
        ]
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
          applicant: string | null
          application_date: string | null
          class_code: string | null
          conflict_analysis: Json | null
          created_at: string
          designated_products: string[] | null
          id: string
          image_url: string | null
          kipris_search_id: string | null
          registration_date: string | null
          registration_number: string | null
          risk_level: string | null
          session_id: string | null
          similar_group_codes: string[] | null
          similarity_score: number | null
          status: string | null
          trademark_name: string
        }
        Insert: {
          applicant?: string | null
          application_date?: string | null
          class_code?: string | null
          conflict_analysis?: Json | null
          created_at?: string
          designated_products?: string[] | null
          id?: string
          image_url?: string | null
          kipris_search_id?: string | null
          registration_date?: string | null
          registration_number?: string | null
          risk_level?: string | null
          session_id?: string | null
          similar_group_codes?: string[] | null
          similarity_score?: number | null
          status?: string | null
          trademark_name: string
        }
        Update: {
          applicant?: string | null
          application_date?: string | null
          class_code?: string | null
          conflict_analysis?: Json | null
          created_at?: string
          designated_products?: string[] | null
          id?: string
          image_url?: string | null
          kipris_search_id?: string | null
          registration_date?: string | null
          registration_number?: string | null
          risk_level?: string | null
          session_id?: string | null
          similar_group_codes?: string[] | null
          similarity_score?: number | null
          status?: string | null
          trademark_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "similar_trademarks_kipris_search_id_fkey"
            columns: ["kipris_search_id"]
            isOneToOne: false
            referencedRelation: "kipris_searches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "similar_trademarks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_name: {
        Row: {
          data: Json | null
          id: number
          inserted_at: string
          name: string | null
          updated_at: string
        }
        Insert: {
          data?: Json | null
          id?: number
          inserted_at?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json | null
          id?: number
          inserted_at?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trademark_application: {
        Row: {
          address: string
          address_auto_change: boolean | null
          address_detail: string | null
          address_english: string | null
          address_postal_code: string | null
          analysis_session_id: string | null
          applicant_type: string
          application_number: string | null
          city_province: string | null
          created_at: string | null
          delivery_address: string | null
          delivery_address_detail: string | null
          delivery_address_postal_code: string | null
          designated_products: string[] | null
          electronic_certificate: boolean | null
          email: string
          id: string
          industry_description: string
          name_english: string
          name_korean: string
          nationality: string | null
          patent_customer_number: string | null
          payment_status: string | null
          phone_number: string
          product_classification: string | null
          publication_address_method: boolean | null
          receipt_method: string | null
          resident_number: string
          resident_registration_file_url: string | null
          seal_image_url: string | null
          signature_image_url: string | null
          single_application_possible: boolean | null
          status: string | null
          status_details: Json | null
          trademark_image_url: string
          trademark_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address: string
          address_auto_change?: boolean | null
          address_detail?: string | null
          address_english?: string | null
          address_postal_code?: string | null
          analysis_session_id?: string | null
          applicant_type: string
          application_number?: string | null
          city_province?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_address_detail?: string | null
          delivery_address_postal_code?: string | null
          designated_products?: string[] | null
          electronic_certificate?: boolean | null
          email: string
          id?: string
          industry_description: string
          name_english: string
          name_korean: string
          nationality?: string | null
          patent_customer_number?: string | null
          payment_status?: string | null
          phone_number: string
          product_classification?: string | null
          publication_address_method?: boolean | null
          receipt_method?: string | null
          resident_number: string
          resident_registration_file_url?: string | null
          seal_image_url?: string | null
          signature_image_url?: string | null
          single_application_possible?: boolean | null
          status?: string | null
          status_details?: Json | null
          trademark_image_url: string
          trademark_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string
          address_auto_change?: boolean | null
          address_detail?: string | null
          address_english?: string | null
          address_postal_code?: string | null
          analysis_session_id?: string | null
          applicant_type?: string
          application_number?: string | null
          city_province?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_address_detail?: string | null
          delivery_address_postal_code?: string | null
          designated_products?: string[] | null
          electronic_certificate?: boolean | null
          email?: string
          id?: string
          industry_description?: string
          name_english?: string
          name_korean?: string
          nationality?: string | null
          patent_customer_number?: string | null
          payment_status?: string | null
          phone_number?: string
          product_classification?: string | null
          publication_address_method?: boolean | null
          receipt_method?: string | null
          resident_number?: string
          resident_registration_file_url?: string | null
          seal_image_url?: string | null
          signature_image_url?: string | null
          single_application_possible?: boolean | null
          status?: string | null
          status_details?: Json | null
          trademark_image_url?: string
          trademark_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trademark_evaluation_analysis: {
        Row: {
          analysis_confidence: number | null
          analysis_version: string | null
          classification_data: Json | null
          code_compatibility_analysis: string
          code_compatibility_score: number
          conflicting_trademarks: Json | null
          created_at: string | null
          distinctiveness_analysis: string
          distinctiveness_score: number
          id: string
          processing_time_ms: number | null
          registration_success_probability: number
          session_id: string | null
          similarity_analysis: string
          similarity_breakdown: Json | null
          similarity_score: number
          updated_at: string | null
        }
        Insert: {
          analysis_confidence?: number | null
          analysis_version?: string | null
          classification_data?: Json | null
          code_compatibility_analysis: string
          code_compatibility_score: number
          conflicting_trademarks?: Json | null
          created_at?: string | null
          distinctiveness_analysis: string
          distinctiveness_score: number
          id?: string
          processing_time_ms?: number | null
          registration_success_probability: number
          session_id?: string | null
          similarity_analysis: string
          similarity_breakdown?: Json | null
          similarity_score: number
          updated_at?: string | null
        }
        Update: {
          analysis_confidence?: number | null
          analysis_version?: string | null
          classification_data?: Json | null
          code_compatibility_analysis?: string
          code_compatibility_score?: number
          conflicting_trademarks?: Json | null
          created_at?: string | null
          distinctiveness_analysis?: string
          distinctiveness_score?: number
          id?: string
          processing_time_ms?: number | null
          registration_success_probability?: number
          session_id?: string | null
          similarity_analysis?: string
          similarity_breakdown?: Json | null
          similarity_score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trademark_evaluation_analysis_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_checkpoints: {
        Row: {
          created_at: string
          current_question_type: string | null
          current_step: string
          current_sub_step: string | null
          execution_time_ms: number | null
          id: string
          progress: number | null
          retry_count: number | null
          session_id: string | null
          state_data: Json | null
        }
        Insert: {
          created_at?: string
          current_question_type?: string | null
          current_step: string
          current_sub_step?: string | null
          execution_time_ms?: number | null
          id?: string
          progress?: number | null
          retry_count?: number | null
          session_id?: string | null
          state_data?: Json | null
        }
        Update: {
          created_at?: string
          current_question_type?: string | null
          current_step?: string
          current_sub_step?: string | null
          execution_time_ms?: number | null
          id?: string
          progress?: number | null
          retry_count?: number | null
          session_id?: string | null
          state_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_checkpoints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      auth_logs: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string | null
          ip_address: unknown | null
          metadata: Json | null
          provider: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string | null
          ip_address?: unknown | null
          metadata?: Json | null
          provider?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string | null
          ip_address?: unknown | null
          metadata?: Json | null
          provider?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string | null
          marketing_agreed: boolean | null
          name: string | null
          phone: string | null
          provider: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          marketing_agreed?: boolean | null
          name?: string | null
          phone?: string | null
          provider?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          marketing_agreed?: boolean | null
          name?: string | null
          phone?: string | null
          provider?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      convert_risk_level_to_english: {
        Args: { korean_risk: string }
        Returns: string
      }
      create_auth_log: {
        Args: {
          event_type: string
          ip_address?: unknown
          metadata?: Json
          provider_name?: string
          user_agent?: string
          user_id: string
        }
        Returns: string
      }
      generate_voucher_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_profile_by_email: {
        Args: { user_email: string }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          id: string
          marketing_agreed: boolean
          name: string
          phone: string
          role: string
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
          active_users: number
          deleted_users: number
          email_users: number
          social_users: number
          total_users: number
        }[]
      }
      link_social_account: {
        Args: {
          provider_data?: Json
          provider_email?: string
          provider_name: string
          provider_user_id: string
          user_id: string
        }
        Returns: string
      }
      migrate_ai_analysis_to_json: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      save_trademark_analysis_session: {
        Args: {
          p_conversations?: Json
          p_expert_queries?: Json
          p_final_result?: Json
          p_information_checklist?: Json
          p_kipris_searches?: Json
          p_pending_confirmations?: Json
          p_product_classifications?: Json
          p_session_data: Json
          p_similar_trademarks?: Json
          p_workflow_checkpoints?: Json
        }
        Returns: string
      }
      save_trademark_analysis_session_v2: {
        Args: {
          p_conversations?: Json
          p_expert_queries?: Json
          p_final_result?: Json
          p_information_checklist?: Json
          p_kipris_searches?: Json
          p_pending_confirmations?: Json
          p_product_classifications?: Json
          p_session_data: Json
          p_similar_trademarks?: Json
          p_workflow_checkpoints?: Json
        }
        Returns: string
      }
      search_similar_products: {
        Args: {
          result_limit: number
          search_query: string
          target_class_code: number
        }
        Returns: {
          class_code: number
          created_at: string
          id: number
          product_name: string
          similarity: number
          similarity_group_code: string
        }[]
      }
      soft_delete_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      unlink_social_account: {
        Args: { provider_name: string; user_id: string }
        Returns: boolean
      }
      update_search_progress: {
        Args:
          | {
              new_designated_products?: string[]
              new_product_codes?: string[]
              new_progress?: number
              new_results?: Json
              new_similar_codes?: string[]
              new_status: string
              search_id: string
            }
          | {
              new_progress?: number
              new_results?: Json
              new_status: string
              search_id: string
            }
        Returns: boolean
      }
      upsert_kipris_similarity_codes: {
        Args: {
          p_application_number: string
          p_class_code?: string
          p_codes: string[]
          p_title?: string
        }
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
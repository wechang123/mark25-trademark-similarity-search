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
          selected_similar_code: string | null
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
          selected_similar_code?: string | null
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
          selected_similar_code?: string | null
          similar_group_codes?: string[] | null
          status?: string | null
          trademark_name?: string
          trademark_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
  trademark_analysis: {
    Tables: {
      analysis_sessions: {
        Row: {
          business_description: string | null
          completed_at: string | null
          created_at: string
          debug_user_id: string | null
          designated_products: string[] | null
          id: string
          image_file_data: string | null
          image_url: string | null
          is_debug_mode: boolean | null
          product_classification_codes: number[] | null
          progress: number | null
          selected_similar_code: string | null
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
          debug_user_id?: string | null
          designated_products?: string[] | null
          id?: string
          image_file_data?: string | null
          image_url?: string | null
          is_debug_mode?: boolean | null
          product_classification_codes?: number[] | null
          progress?: number | null
          selected_similar_code?: string | null
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
          debug_user_id?: string | null
          designated_products?: string[] | null
          id?: string
          image_file_data?: string | null
          image_url?: string | null
          is_debug_mode?: boolean | null
          product_classification_codes?: number[] | null
          progress?: number | null
          selected_similar_code?: string | null
          similar_group_codes?: string[] | null
          status?: string | null
          trademark_name?: string
          trademark_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      api_call_logs: {
        Row: {
          api_type: string
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          request_data: Json | null
          request_timestamp: string
          response_data: Json | null
          response_timestamp: string | null
          session_id: string
          status_code: number | null
          tokens_used: number | null
        }
        Insert: {
          api_type: string
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          request_data?: Json | null
          request_timestamp?: string
          response_data?: Json | null
          response_timestamp?: string | null
          session_id: string
          status_code?: number | null
          tokens_used?: number | null
        }
        Update: {
          api_type?: string
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          request_data?: Json | null
          request_timestamp?: string
          response_data?: Json | null
          response_timestamp?: string | null
          session_id?: string
          status_code?: number | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      data_processing_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_details: Json | null
          id: string
          input_data: Json | null
          output_data: Json | null
          processing_type: string
          session_id: string
          status: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          processing_type: string
          session_id: string
          status: string
          timestamp?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          processing_type?: string
          session_id?: string
          status?: string
          timestamp?: string
        }
        Relationships: []
      }
      stage1_trademark_input: {
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
          selected_similar_code: string | null
          similar_group_codes: string[] | null
          stage2_completed_at: string | null
          stage2_started_at: string | null
          stage3_completed_at: string | null
          stage3_started_at: string | null
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
          selected_similar_code?: string | null
          similar_group_codes?: string[] | null
          stage2_completed_at?: string | null
          stage2_started_at?: string | null
          stage3_completed_at?: string | null
          stage3_started_at?: string | null
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
          selected_similar_code?: string | null
          similar_group_codes?: string[] | null
          stage2_completed_at?: string | null
          stage2_started_at?: string | null
          stage3_completed_at?: string | null
          stage3_started_at?: string | null
          status?: string | null
          trademark_name?: string
          trademark_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
  user_management: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          marketing_agreed: boolean | null
          name: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id: string
          marketing_agreed?: boolean | null
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          marketing_agreed?: boolean | null
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_table: string | null
          user_agent: string | null
          user_id: string
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
          user_id: string
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
          user_id?: string
          user_role?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
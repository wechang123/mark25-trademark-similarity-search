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
      embedding_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          failed_images: number | null
          job_id: string
          job_type: string
          model_name: string
          processed_images: number | null
          started_at: string | null
          status: string | null
          total_images: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_images?: number | null
          job_id?: string
          job_type: string
          model_name: string
          processed_images?: number | null
          started_at?: string | null
          status?: string | null
          total_images: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_images?: number | null
          job_id?: string
          job_type?: string
          model_name?: string
          processed_images?: number | null
          started_at?: string | null
          status?: string | null
          total_images?: number
        }
        Relationships: []
      }
      image_metadata: {
        Row: {
          application_date: string | null
          classification_code: string | null
          created_at: string | null
          expiry_date: string | null
          file_size: number | null
          file_url: string
          format: string | null
          goods_description: string | null
          height: number | null
          id: number
          image_id: string
          owner_address: string | null
          owner_name: string | null
          priority_claim: Json | null
          registration_date: string | null
          status: string | null
          trademark_number: string | null
          updated_at: string | null
          width: number | null
        }
        Insert: {
          application_date?: string | null
          classification_code?: string | null
          created_at?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_url: string
          format?: string | null
          goods_description?: string | null
          height?: number | null
          id?: number
          image_id: string
          owner_address?: string | null
          owner_name?: string | null
          priority_claim?: Json | null
          registration_date?: string | null
          status?: string | null
          trademark_number?: string | null
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          application_date?: string | null
          classification_code?: string | null
          created_at?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string
          format?: string | null
          goods_description?: string | null
          height?: number | null
          id?: number
          image_id?: string
          owner_address?: string | null
          owner_name?: string | null
          priority_claim?: Json | null
          registration_date?: string | null
          status?: string | null
          trademark_number?: string | null
          updated_at?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_image_id"
            columns: ["image_id"]
            isOneToOne: true
            referencedRelation: "image_vectors"
            referencedColumns: ["image_id"]
          },
        ]
      }
      image_vectors: {
        Row: {
          created_at: string | null
          embedding: string
          embedding_dim: number
          id: number
          image_id: string
          metadata: Json | null
          model_name: string
          model_version: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          embedding: string
          embedding_dim?: number
          id?: number
          image_id?: string
          metadata?: Json | null
          model_name?: string
          model_version?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string
          embedding_dim?: number
          id?: number
          image_id?: string
          metadata?: Json | null
          model_name?: string
          model_version?: string
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
      trademark_application: {
        Row: {
          address: string | null
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
          designated_products: string[]
          electronic_certificate: boolean | null
          email: string | null
          id: string
          industry_description: string
          name_english: string
          name_korean: string
          nationality: string | null
          patent_customer_number: string | null
          payment_status: string | null
          phone_number: string | null
          product_classification: string
          publication_address_method: boolean | null
          receipt_method: string | null
          resident_number: string | null
          resident_registration_file_url: string | null
          seal_certificate_image_url: string | null
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
          address?: string | null
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
          designated_products: string[]
          electronic_certificate?: boolean | null
          email?: string | null
          id?: string
          industry_description: string
          name_english: string
          name_korean: string
          nationality?: string | null
          patent_customer_number?: string | null
          payment_status?: string | null
          phone_number?: string | null
          product_classification: string
          publication_address_method?: boolean | null
          receipt_method?: string | null
          resident_number?: string | null
          resident_registration_file_url?: string | null
          seal_certificate_image_url?: string | null
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
          address?: string | null
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
          designated_products?: string[]
          electronic_certificate?: boolean | null
          email?: string | null
          id?: string
          industry_description?: string
          name_english?: string
          name_korean?: string
          nationality?: string | null
          patent_customer_number?: string | null
          payment_status?: string | null
          phone_number?: string | null
          product_classification?: string
          publication_address_method?: boolean | null
          receipt_method?: string | null
          resident_number?: string | null
          resident_registration_file_url?: string | null
          seal_certificate_image_url?: string | null
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
        Relationships: []
      }
      social_accounts: {
        Row: {
          connected_at: string | null
          id: string | null
          provider: string | null
          provider_data: Json | null
          provider_email: string | null
          provider_user_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
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
      admin_permissions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          permission_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permission_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          permission_type?: string
          updated_at?: string
          user_id?: string
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

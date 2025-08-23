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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      compliance_assignment_rules: {
        Row: {
          auto_assign: boolean | null
          compliance_type: string | null
          created_at: string | null
          department_code: string | null
          frequency: string | null
          id: string
          preferred_checker_count: number | null
          preferred_maker_count: number | null
          risk_type: string | null
          updated_at: string | null
        }
        Insert: {
          auto_assign?: boolean | null
          compliance_type?: string | null
          created_at?: string | null
          department_code?: string | null
          frequency?: string | null
          id?: string
          preferred_checker_count?: number | null
          preferred_maker_count?: number | null
          risk_type?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_assign?: boolean | null
          compliance_type?: string | null
          created_at?: string | null
          department_code?: string | null
          frequency?: string | null
          id?: string
          preferred_checker_count?: number | null
          preferred_maker_count?: number | null
          risk_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_assignment_rules_department_code_fkey"
            columns: ["department_code"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["code"]
          },
        ]
      }
      compliance_assignments: {
        Row: {
          assigned_to: string
          checker_id: string | null
          checker_remarks: string | null
          completed_at: string | null
          compliance_id: string
          created_at: string
          document_url: string | null
          due_date: string
          escalation_level: number | null
          id: string
          maker_remarks: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_to: string
          checker_id?: string | null
          checker_remarks?: string | null
          completed_at?: string | null
          compliance_id: string
          created_at?: string
          document_url?: string | null
          due_date: string
          escalation_level?: number | null
          id?: string
          maker_remarks?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          checker_id?: string | null
          checker_remarks?: string | null
          completed_at?: string | null
          compliance_id?: string
          created_at?: string
          document_url?: string | null
          due_date?: string
          escalation_level?: number | null
          id?: string
          maker_remarks?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_assignments_checker_id_fkey"
            columns: ["checker_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_assignments_compliance_id_fkey"
            columns: ["compliance_id"]
            isOneToOne: false
            referencedRelation: "compliances"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_bulk_uploads: {
        Row: {
          completed_at: string | null
          created_at: string
          error_log: Json | null
          failed_records: number | null
          filename: string
          id: string
          status: string | null
          successful_records: number | null
          total_records: number | null
          uploaded_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_records?: number | null
          filename: string
          id?: string
          status?: string | null
          successful_records?: number | null
          total_records?: number | null
          uploaded_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          failed_records?: number | null
          filename?: string
          id?: string
          status?: string | null
          successful_records?: number | null
          total_records?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_bulk_uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_metrics: {
        Row: {
          completed_compliances: number | null
          created_at: string
          department_code: string | null
          id: string
          metric_date: string
          overdue_compliances: number | null
          pending_compliances: number | null
          sla_compliance_rate: number | null
          tat_breaches: number | null
          total_compliances: number | null
          updated_at: string
        }
        Insert: {
          completed_compliances?: number | null
          created_at?: string
          department_code?: string | null
          id?: string
          metric_date?: string
          overdue_compliances?: number | null
          pending_compliances?: number | null
          sla_compliance_rate?: number | null
          tat_breaches?: number | null
          total_compliances?: number | null
          updated_at?: string
        }
        Update: {
          completed_compliances?: number | null
          created_at?: string
          department_code?: string | null
          id?: string
          metric_date?: string
          overdue_compliances?: number | null
          pending_compliances?: number | null
          sla_compliance_rate?: number | null
          tat_breaches?: number | null
          total_compliances?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_metrics_department_code_fkey"
            columns: ["department_code"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["code"]
          },
        ]
      }
      compliance_user_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          compliance_id: string
          created_at: string
          id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          compliance_id: string
          created_at?: string
          id?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          compliance_id?: string
          created_at?: string
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_user_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_user_assignments_compliance_id_fkey"
            columns: ["compliance_id"]
            isOneToOne: false
            referencedRelation: "compliances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_user_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      compliances: {
        Row: {
          category: string
          checker: string | null
          client_frequency: string | null
          compliance_id: string
          compliance_type: string | null
          created_at: string
          department_code: string | null
          description: string | null
          frequency: string
          id: string
          maker: string | null
          name: string
          next_due: string | null
          risk_type: string | null
          section: string | null
          short_description: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          checker?: string | null
          client_frequency?: string | null
          compliance_id?: string
          compliance_type?: string | null
          created_at?: string
          department_code?: string | null
          description?: string | null
          frequency: string
          id?: string
          maker?: string | null
          name?: string
          next_due?: string | null
          risk_type?: string | null
          section?: string | null
          short_description?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          checker?: string | null
          client_frequency?: string | null
          compliance_id?: string
          compliance_type?: string | null
          created_at?: string
          department_code?: string | null
          description?: string | null
          frequency?: string
          id?: string
          maker?: string | null
          name?: string
          next_due?: string | null
          risk_type?: string | null
          section?: string | null
          short_description?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliances_department_code_fkey"
            columns: ["department_code"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["code"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          employee_count: number
          head: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          employee_count?: number
          head: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          employee_count?: number
          head?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          department_code: string | null
          designation: string | null
          email: string
          emp_id: string
          id: string
          name: string
          phone: string | null
          role_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_code?: string | null
          designation?: string | null
          email: string
          emp_id: string
          id?: string
          name: string
          phone?: string | null
          role_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_code?: string | null
          designation?: string | null
          email?: string
          emp_id?: string
          id?: string
          name?: string
          phone?: string | null
          role_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_code_fkey"
            columns: ["department_code"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "employees_role_name_fkey"
            columns: ["role_name"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["role_name"]
          },
        ]
      }
      escalation_items: {
        Row: {
          compliance_assignment_id: string
          created_at: string
          escalated_at: string
          escalated_to: string | null
          escalation_level: number
          id: string
          reason: string
          resolved: boolean | null
          resolved_at: string | null
        }
        Insert: {
          compliance_assignment_id: string
          created_at?: string
          escalated_at?: string
          escalated_to?: string | null
          escalation_level?: number
          id?: string
          reason: string
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Update: {
          compliance_assignment_id?: string
          created_at?: string
          escalated_at?: string
          escalated_to?: string | null
          escalation_level?: number
          id?: string
          reason?: string
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalation_items_compliance_assignment_id_fkey"
            columns: ["compliance_assignment_id"]
            isOneToOne: false
            referencedRelation: "compliance_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_items_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          department_code: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          status: string
          updated_at: string
          user_role: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_code?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          status?: string
          updated_at?: string
          user_role?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_code?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          status?: string
          updated_at?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_code_fkey"
            columns: ["department_code"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["code"]
          },
        ]
      }
      user_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          performed_by: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          performed_by?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          performed_by?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          description: string
          id: string
          permissions: string[]
          role_name: string
          status: string
          updated_at: string
          user_count: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          permissions?: string[]
          role_name: string
          status?: string
          updated_at?: string
          user_count?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          permissions?: string[]
          role_name?: string
          status?: string
          updated_at?: string
          user_count?: number
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          last_login_attempt: string | null
          last_successful_login: string | null
          locked_until: string | null
          login_attempts: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_login_attempt?: string | null
          last_successful_login?: string | null
          locked_until?: string | null
          login_attempts?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_login_attempt?: string | null
          last_successful_login?: string | null
          locked_until?: string | null
          login_attempts?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_compliance_smart: {
        Args: { p_compliance_id: string }
        Returns: Json
      }
      calculate_tat_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_days_overdue: number
          overdue_count: number
          tat_breaches: number
          total_assignments: number
        }[]
      }
      generate_sequential_id: {
        Args: { table_name: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_user_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: unknown
          p_performed_by?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_daily_metrics: {
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

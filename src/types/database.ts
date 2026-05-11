export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          first_name: string
          last_name: string
          fiscal_code: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          address: string | null
          created_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          fiscal_code: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          address?: string | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          fiscal_code?: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          address?: string | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
      }
      cases: {
        Row: {
          id: string
          contact_id: string | null
          title: string
          description: string | null
          status: 'open' | 'in_progress' | 'pending_documents' | 'completed' | 'rejected' | null
          type: 'caf' | 'patronato' | 'invalidita_civile'
          created_at: string | null
          updated_at: string | null
          assigned_to: string | null
        }
        Insert: {
          id?: string
          contact_id?: string | null
          title: string
          description?: string | null
          status?: 'open' | 'in_progress' | 'pending_documents' | 'completed' | 'rejected' | null
          type: 'caf' | 'patronato' | 'invalidita_civile'
          created_at?: string | null
          updated_at?: string | null
          assigned_to?: string | null
        }
        Update: {
          id?: string
          contact_id?: string | null
          title?: string
          description?: string | null
          status?: 'open' | 'in_progress' | 'pending_documents' | 'completed' | 'rejected' | null
          type?: 'caf' | 'patronato' | 'invalidita_civile'
          created_at?: string | null
          updated_at?: string | null
          assigned_to?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          case_id: string | null
          contact_id: string | null
          file_name: string
          file_path: string
          file_type: string | null
          file_size: number | null
          created_at: string | null
          uploaded_by: string | null
          document_embedding: string | null // Vector type is usually represented as string in generic types or array of numbers
        }
        Insert: {
          id?: string
          case_id?: string | null
          contact_id?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          file_size?: number | null
          created_at?: string | null
          uploaded_by?: string | null
          document_embedding?: string | null
        }
        Update: {
          id?: string
          case_id?: string | null
          contact_id?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          file_size?: number | null
          created_at?: string | null
          uploaded_by?: string | null
          document_embedding?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          case_id: string | null
          title: string
          description: string | null
          due_date: string | null
          is_completed: boolean | null
          created_at: string | null
          updated_at: string | null
          assigned_to: string | null
        }
        Insert: {
          id?: string
          case_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          is_completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          assigned_to?: string | null
        }
        Update: {
          id?: string
          case_id?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          is_completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          assigned_to?: string | null
        }
      }
      medical_certificates: {
        Row: {
          id: string
          case_id: string | null
          doctor_name: string
          issue_date: string
          certificate_number: string | null
          notes: string | null
          document_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          case_id?: string | null
          doctor_name: string
          issue_date: string
          certificate_number?: string | null
          notes?: string | null
          document_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          case_id?: string | null
          doctor_name?: string
          issue_date?: string
          certificate_number?: string | null
          notes?: string | null
          document_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      case_status: 'open' | 'in_progress' | 'pending_documents' | 'completed' | 'rejected'
      case_type: 'caf' | 'patronato' | 'invalidita_civile'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

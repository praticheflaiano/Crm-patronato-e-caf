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
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string
          full_name: string | null
          role: 'admin' | 'operator' | 'collaborator' | 'doctor'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          organization_id: string
          full_name?: string | null
          role?: 'admin' | 'operator' | 'collaborator' | 'doctor'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          full_name?: string | null
          role?: 'admin' | 'operator' | 'collaborator' | 'doctor'
          created_at?: string | null
          updated_at?: string | null
        }
      }
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
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
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
          organization_id: string
          doctor_id: string | null
          invalidity_details_id: string | null
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
          organization_id?: string
          doctor_id?: string | null
          invalidity_details_id?: string | null
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
          organization_id?: string
          doctor_id?: string | null
          invalidity_details_id?: string | null
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
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
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
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
        }
      }
      medical_certificates: {
        Row: {
          id: string
          case_id: string | null
          certificate_type: string
          certificate_number: string | null
          certificate_series: string | null
          doctor_name: string
          doctor_tax_code: string | null
          doctor_phone: string | null
          doctor_email: string | null
          doctor_address: string | null
          doctor_structure: string | null
          asl_code: string | null
          diagnosis: string
          icd_code: string | null
          clinical_findings: string | null
          functional_limitations: string | null
          prognosis: string | null
          therapy_prescribed: string | null
          issue_date: string
          expiry_date: string | null
          visit_date: string | null
          document_id: string | null
          attachment_path: string | null
          digital_signature_present: boolean
          signature_date: string | null
          is_valid: boolean
          verification_status: string
          verification_notes: string | null
          organization_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          case_id?: string | null
          certificate_type: string
          certificate_number?: string | null
          certificate_series?: string | null
          doctor_name: string
          doctor_tax_code?: string | null
          doctor_phone?: string | null
          doctor_email?: string | null
          doctor_address?: string | null
          doctor_structure?: string | null
          asl_code?: string | null
          diagnosis: string
          icd_code?: string | null
          clinical_findings?: string | null
          functional_limitations?: string | null
          prognosis?: string | null
          therapy_prescribed?: string | null
          issue_date: string
          expiry_date?: string | null
          visit_date?: string | null
          document_id?: string | null
          attachment_path?: string | null
          digital_signature_present?: boolean
          signature_date?: string | null
          is_valid?: boolean
          verification_status?: string
          verification_notes?: string | null
          organization_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          case_id?: string | null
          certificate_type?: string
          certificate_number?: string | null
          certificate_series?: string | null
          doctor_name?: string
          doctor_tax_code?: string | null
          doctor_phone?: string | null
          doctor_email?: string | null
          doctor_address?: string | null
          doctor_structure?: string | null
          asl_code?: string | null
          diagnosis?: string
          icd_code?: string | null
          clinical_findings?: string | null
          functional_limitations?: string | null
          prognosis?: string | null
          therapy_prescribed?: string | null
          issue_date?: string
          expiry_date?: string | null
          visit_date?: string | null
          document_id?: string | null
          attachment_path?: string | null
          digital_signature_present?: boolean
          signature_date?: string | null
          is_valid?: boolean
          verification_status?: string
          verification_notes?: string | null
          organization_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      invalidity_details: {
        Row: {
          id: string
          case_id: string
          disability_type: string
          disability_percentage: number
          disability_details: string | null
          inps_visit_date: string | null
          inps_visit_result: string | null
          inps_protocol_number: string | null
          certification_date: string | null
          certification_expiry_date: string | null
          benefits_requested: string[] | null
          benefits_approved: string[] | null
          assessment_status: string
          ap70_filed: boolean
          ap70_filing_date: string | null
          ap70_protocol_number: string | null
          medical_examiner_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          case_id: string
          disability_type: string
          disability_percentage: number
          disability_details?: string | null
          inps_visit_date?: string | null
          inps_visit_result?: string | null
          inps_protocol_number?: string | null
          certification_date?: string | null
          certification_expiry_date?: string | null
          benefits_requested?: string[] | null
          benefits_approved?: string[] | null
          assessment_status?: string
          ap70_filed?: boolean
          ap70_filing_date?: string | null
          ap70_protocol_number?: string | null
          medical_examiner_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          case_id?: string
          disability_type?: string
          disability_percentage?: number
          disability_details?: string | null
          inps_visit_date?: string | null
          inps_visit_result?: string | null
          inps_protocol_number?: string | null
          certification_date?: string | null
          certification_expiry_date?: string | null
          benefits_requested?: string[] | null
          benefits_approved?: string[] | null
          assessment_status?: string
          ap70_filed?: boolean
          ap70_filing_date?: string | null
          ap70_protocol_number?: string | null
          medical_examiner_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'task' | 'case' | 'document'
          related_id: string | null
          is_read: boolean
          created_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'task' | 'case' | 'document'
          related_id?: string | null
          is_read?: boolean
          created_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'task' | 'case' | 'document'
          related_id?: string | null
          is_read?: boolean
          created_at?: string | null
          organization_id?: string
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
      user_role: 'admin' | 'operator' | 'collaborator' | 'doctor'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

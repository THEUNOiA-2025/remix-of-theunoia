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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          amount: number
          created_at: string
          freelancer_id: string
          id: string
          project_id: string
          proposal: string
          status: Database["public"]["Enums"]["bid_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          freelancer_id: string
          id?: string
          project_id: string
          proposal: string
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          freelancer_id?: string
          id?: string
          project_id?: string
          proposal?: string
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bids_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          author_id: string
          blog_images: string[] | null
          canonical_url: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          faqs: Json | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          blog_images?: string[] | null
          canonical_url?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          faqs?: Json | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          blog_images?: string[] | null
          canonical_url?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          faqs?: Json | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      colleges: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          short_name: string | null
          state: string
          updated_at: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          short_name?: string | null
          state: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          short_name?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          client_id: string
          created_at: string
          freelancer_id: string
          id: string
          last_message_at: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          freelancer_id: string
          id?: string
          last_message_at?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          freelancer_id?: string
          id?: string
          last_message_at?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          reference_id: string | null
          transaction_type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          transaction_type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          transaction_type?: Database["public"]["Enums"]["credit_transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {

          attempt_count: number
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invalidated_at: string | null
          invalidated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempt_count?: number
          attempt_count?: number
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invalidated_at?: string | null
          invalidated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempt_count?: number
          attempt_count?: number
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invalidated_at?: string | null
          invalidated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      freelancer_access: {
        Row: {
          created_at: string | null
          granted_at: string | null
          has_access: boolean | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          has_access?: boolean | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          has_access?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      freelancer_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      freelancer_ratings: {
        Row: {
          client_id: string
          created_at: string | null
          feedback: string | null
          freelancer_id: string
          id: string
          project_id: string
          rating: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          feedback?: string | null
          freelancer_id: string
          id?: string
          project_id: string
          rating: number
        }
        Update: {
          client_id?: string
          created_at?: string | null
          feedback?: string | null
          freelancer_id?: string
          id?: string
          project_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "freelancer_ratings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          currency: string | null
          due_date: string | null
          freelancer_id: string
          id: string
          invoice_number: string
          project_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          freelancer_id: string
          id?: string
          invoice_number: string
          project_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          freelancer_id?: string
          id?: string
          invoice_number?: string
          project_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          project_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          project_id: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          project_id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_activities: {
        Row: {
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          phase: string
          project_id: string
          task_name: string
          timestamp: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          phase: string
          project_id: string
          task_name: string
          timestamp?: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          phase?: string
          project_id?: string
          task_name?: string
          timestamp?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          client_approved: boolean | null
          created_at: string
          freelancer_approved: boolean | null
          id: string
          locked_at: string | null
          locked_by: string | null
          payment_status: string | null
          phase_name: string
          phase_order: number
          project_id: string
          rejection_feedback: string | null
          status: string
          submission_attachments: Json | null
          submission_message: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          client_approved?: boolean | null
          created_at?: string
          freelancer_approved?: boolean | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          payment_status?: string | null
          phase_name: string
          phase_order: number
          project_id: string
          rejection_feedback?: string | null
          status: string
          submission_attachments?: Json | null
          submission_message?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          client_approved?: boolean | null
          created_at?: string
          freelancer_approved?: boolean | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          payment_status?: string | null
          phase_name?: string
          phase_order?: number
          project_id?: string
          rejection_feedback?: string | null
          status?: string
          submission_attachments?: Json | null
          submission_message?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assignee: string
          created_at: string
          deadline: string
          description: string | null
          id: string
          phase: string
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee: string
          created_at?: string
          deadline: string
          description?: string | null
          id?: string
          phase: string
          priority: string
          project_id: string
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string
          created_at?: string
          deadline?: string
          description?: string | null
          id?: string
          phase?: string
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_verifications: {
        Row: {
          college_id: string | null
          community_key: string | null
          community_key: string | null
          created_at: string | null
          email_verified: boolean | null
          email_verified_at: string | null
          enrollment_id: string | null
          id: string
          id_card_url: string | null
          institute_email: string | null
          institute_name: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string | null
          user_id: string
          verification_method: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
        }
        Insert: {
          college_id?: string | null
          community_key?: string | null
          community_key?: string | null
          created_at?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          enrollment_id?: string | null
          id?: string
          id_card_url?: string | null
          institute_email?: string | null
          institute_name?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id: string
          verification_method?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Update: {
          college_id?: string | null
          community_key?: string | null
          community_key?: string | null
          created_at?: string | null
          email_verified?: boolean | null
          email_verified_at?: string | null
          enrollment_id?: string | null
          id?: string
          id_card_url?: string | null
          institute_email?: string | null
          institute_name?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id?: string
          verification_method?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_verifications_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          billing_address: string | null
          bio: string | null
          city: string | null
          client_contract_signed: boolean | null
          client_type: string | null
          college_name: string | null
          consent_version: string | null
          contract_signed: boolean | null
          created_at: string | null
          date_of_birth: string | null
          declarations_accepted: boolean | null
          education_level: string | null
          email: string
          first_name: string
          gender: string | null
          gst_registered: boolean | null
          gst_state: string | null
          gstin: string | null
          id: string
          last_name: string
          legal_business_name: string | null
          pan: string | null
          phone: string | null
          pin_code: string | null
          portfolio_link: string | null
          profile_completed: boolean | null
          profile_picture_url: string | null
          razorpay_contact_id: string | null
          razorpay_fund_account_id: string | null
          registered_address: string | null
          residential_address: string | null
          signature_url: string | null
          signup_device: string | null
          signup_ip: string | null
          skills_category: string | null
          tan: string | null
          tds_consent_accepted: boolean | null
          updated_at: string | null
          upi_id: string | null
          user_id: string
          user_type: string | null
          website: string | null
          will_deduct_tds: boolean | null
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          billing_address?: string | null
          bio?: string | null
          city?: string | null
          client_contract_signed?: boolean | null
          client_type?: string | null
          college_name?: string | null
          consent_version?: string | null
          contract_signed?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          declarations_accepted?: boolean | null
          education_level?: string | null
          email: string
          first_name: string
          gender?: string | null
          gst_registered?: boolean | null
          gst_state?: string | null
          gstin?: string | null
          id?: string
          last_name: string
          legal_business_name?: string | null
          pan?: string | null
          phone?: string | null
          pin_code?: string | null
          portfolio_link?: string | null
          profile_completed?: boolean | null
          profile_picture_url?: string | null
          razorpay_contact_id?: string | null
          razorpay_fund_account_id?: string | null
          registered_address?: string | null
          residential_address?: string | null
          signature_url?: string | null
          signup_device?: string | null
          signup_ip?: string | null
          skills_category?: string | null
          tan?: string | null
          tds_consent_accepted?: boolean | null
          updated_at?: string | null
          upi_id?: string | null
          user_id: string
          user_type?: string | null
          website?: string | null
          will_deduct_tds?: boolean | null
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          billing_address?: string | null
          bio?: string | null
          city?: string | null
          client_contract_signed?: boolean | null
          client_type?: string | null
          college_name?: string | null
          consent_version?: string | null
          contract_signed?: boolean | null
          created_at?: string | null
          date_of_birth?: string | null
          declarations_accepted?: boolean | null
          education_level?: string | null
          email?: string
          first_name?: string
          gender?: string | null
          gst_registered?: boolean | null
          gst_state?: string | null
          gstin?: string | null
          id?: string
          last_name?: string
          legal_business_name?: string | null
          pan?: string | null
          phone?: string | null
          pin_code?: string | null
          portfolio_link?: string | null
          profile_completed?: boolean | null
          profile_picture_url?: string | null
          razorpay_contact_id?: string | null
          razorpay_fund_account_id?: string | null
          registered_address?: string | null
          residential_address?: string | null
          signature_url?: string | null
          signup_device?: string | null
          signup_ip?: string | null
          skills_category?: string | null
          tan?: string | null
          tds_consent_accepted?: boolean | null
          updated_at?: string | null
          upi_id?: string | null
          user_id?: string
          user_type?: string | null
          website?: string | null
          will_deduct_tds?: boolean | null
        }
        Relationships: []
      }
      user_projects: {
        Row: {
          additional_images: string[] | null
          attached_files: Json | null
          bidding_deadline: string | null
          budget: number | null
          category: string | null
          client_feedback: string | null
          community_key: string | null
          community_college_id: string | null
          community_key: string | null
          completed_at: string | null
          completion_data: Json | null
          cover_image_url: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_community_task: boolean
          project_type: string
          rating: number | null
          skills_required: string[] | null
          status: string | null
          subcategory: string | null
          timeline: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_images?: string[] | null
          attached_files?: Json | null
          bidding_deadline?: string | null
          budget?: number | null
          category?: string | null
          client_feedback?: string | null
          community_key?: string | null
          community_college_id?: string | null
          community_key?: string | null
          completed_at?: string | null
          completion_data?: Json | null
          cover_image_url?: string | null
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_community_task?: boolean
          project_type?: string
          rating?: number | null
          skills_required?: string[] | null
          status?: string | null
          subcategory?: string | null
          timeline?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_images?: string[] | null
          attached_files?: Json | null
          bidding_deadline?: string | null
          budget?: number | null
          category?: string | null
          client_feedback?: string | null
          community_key?: string | null
          community_college_id?: string | null
          community_key?: string | null
          completed_at?: string | null
          completion_data?: Json | null
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_community_task?: boolean
          project_type?: string
          rating?: number | null
          skills_required?: string[] | null
          status?: string | null
          subcategory?: string | null
          timeline?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_community_college_id_fkey"
            columns: ["community_college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          created_at: string
          id: string
          skill_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skill_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skill_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number | null
          last_activity_date: string | null
          longest_streak: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_todos: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          priority: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          priority: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          priority?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_weekly_plans: {
        Row: {
          created_at: string
          date: string
          focus: string | null
          id: string
          tasks: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          focus?: string | null
          id?: string
          tasks?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          focus?: string | null
          id?: string
          tasks?: Json | null
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
      admin_modify_credits: {
        Args: { _amount: number; _notes?: string; _target_user_id: string }
        Returns: number
      }
      compute_community_key: {
        Args: { p_college_id: string | null; p_institute_name: string | null }
        Returns: string
      }
      get_college_states: {
        Args: never
        Returns: {
          state: string
        }[]
      }
      get_community_dashboard: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_status?: string
        }
        Returns: Json
      }
      get_community_dashboard: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_status?: string
        }
        Returns: Json
      }
      get_freelancer_credit_balance: {
        Args: { _user_id: string }
        Returns: number
      }
      get_my_community_context: {
        Args: never
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_sufficient_credits: {
        Args: { _required_credits?: number; _user_id: string }
        Returns: boolean
      }
      normalize_community_name: {
        Args: { input_name: string }
        Returns: string
      }
      resolve_my_community_key: {
        Args: never
        Returns: string
      }
      review_student_verification: {
        Args: {
          p_action: string
          p_rejection_reason?: string | null
          p_verification_id: string
        }
        Returns: Database["public"]["Tables"]["student_verifications"]["Row"]
      }
      submit_project_completion: {
        Args: { p_attachments: Json; p_message: string; p_project_id: string }
        Returns: undefined
      }
      update_community_member_settings: {
        Args: { p_enrollment_id: string | null; p_institute_email: string | null }
        Returns: Database["public"]["Tables"]["student_verifications"]["Row"]
      }
      upsert_student_verification_submission: {
        Args: {
          p_college_id: string | null
          p_email_verified: boolean
          p_enrollment_id: string | null
          p_first_name: string
          p_id_card_url: string | null
          p_institute_email: string | null
          p_institute_name: string | null
          p_last_name: string
          p_phone: string
          p_verification_method: string
        }
        Returns: Database["public"]["Tables"]["student_verifications"]["Row"]
      }
      user_has_bid_on_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      bid_status: "pending" | "accepted" | "rejected"
      credit_transaction_type:
        | "bid_placed"
        | "admin_grant"
        | "admin_deduct"
        | "signup_bonus"
        | "refund"
        | "project_posted"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      bid_status: ["pending", "accepted", "rejected"],
      credit_transaction_type: [
        "bid_placed",
        "admin_grant",
        "admin_deduct",
        "signup_bonus",
        "refund",
        "project_posted",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const

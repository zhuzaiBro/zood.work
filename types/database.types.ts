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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      faucet_claims: {
        Row: {
          amount: number
          created_at: string
          id: string
          ip_address: string
          tx_hash: string
          wallet_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          ip_address: string
          tx_hash: string
          wallet_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          ip_address?: string
          tx_hash?: string
          wallet_address?: string
        }
        Relationships: []
      }
      interview_collection_tags: {
        Row: {
          collection_id: string
          id: string
          tag_id: string
        }
        Insert: {
          collection_id: string
          id?: string
          tag_id: string
        }
        Update: {
          collection_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_collection_tags_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "interview_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_collection_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "interview_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_collections: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          sort: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          sort?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          sort?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_question: {
        Row: {
          collection_id: string | null
          content: string | null
          created_at: string
          difficulty: string | null
          id: string
          is_vip: boolean | null
          sort: number | null
          title: string
          updated_at: string
          vip_level_required: number | null
        }
        Insert: {
          collection_id?: string | null
          content?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          is_vip?: boolean | null
          sort?: number | null
          title: string
          updated_at?: string
          vip_level_required?: number | null
        }
        Update: {
          collection_id?: string | null
          content?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          is_vip?: boolean | null
          sort?: number | null
          title?: string
          updated_at?: string
          vip_level_required?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_question_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "interview_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_question_submissions: {
        Row: {
          admin_note: string | null
          attachment_mime_type: string | null
          attachment_name: string | null
          attachment_path: string | null
          attachment_size_bytes: number | null
          collection_id: string | null
          contact: string | null
          content: string
          created_at: string
          difficulty: string | null
          id: string
          source: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          attachment_mime_type?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size_bytes?: number | null
          collection_id?: string | null
          contact?: string | null
          content: string
          created_at?: string
          difficulty?: string | null
          id?: string
          source?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          attachment_mime_type?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size_bytes?: number | null
          collection_id?: string | null
          contact?: string | null
          content?: string
          created_at?: string
          difficulty?: string | null
          id?: string
          source?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_question_submissions_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "interview_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_question_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_question_tags: {
        Row: {
          question_id: string
          tag_id: string
        }
        Insert: {
          question_id: string
          tag_id: string
        }
        Update: {
          question_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_question_tags_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_question"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_question_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "interview_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort?: number | null
        }
        Relationships: []
      }
      post_cate_relations: {
        Row: {
          cate_id: string
          post_id: string
        }
        Insert: {
          cate_id: string
          post_id: string
        }
        Update: {
          cate_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_post_cate_relations_post"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_post_cate_relations_post_cate"
            columns: ["cate_id"]
            isOneToOne: false
            referencedRelation: "post_cates"
            referencedColumns: ["id"]
          },
        ]
      }
      post_cates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_post_comments_replies"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_post_comments_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_comments"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          banner: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          is_public: boolean | null
          published: boolean | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          banner?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_public?: boolean | null
          published?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          banner?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_public?: boolean | null
          published?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_posts"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string | null
          username: string
          vip_level: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
          username: string
          vip_level?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
          username?: string
          vip_level?: number | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          cover_image_url: string | null
          price: number
          is_free: boolean
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          cover_image_url?: string | null
          price?: number
          is_free?: boolean
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          cover_image_url?: string | null
          price?: number
          is_free?: boolean
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          id: string
          chapter_id: string
          title: string
          description: string | null
          courseware_name: string | null
          courseware_url: string | null
          content_html: string | null
          content_markdown: string | null
          video_id: string | null
          video_url: string | null
          duration: number | null
          is_free: boolean
          is_locked: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          title: string
          description?: string | null
          courseware_name?: string | null
          courseware_url?: string | null
          content_html?: string | null
          content_markdown?: string | null
          video_id?: string | null
          video_url?: string | null
          duration?: number | null
          is_free?: boolean
          is_locked?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          title?: string
          description?: string | null
          courseware_name?: string | null
          courseware_url?: string | null
          content_html?: string | null
          content_markdown?: string | null
          video_id?: string | null
          video_url?: string | null
          duration?: number | null
          is_free?: boolean
          is_locked?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          id: string
          title: string
          description: string | null
          source_file: string
          cos_prefix: string | null
          m3u8_path: string | null
          duration: number | null
          width: number | null
          height: number | null
          fps: number | null
          segment_count: number | null
          status: string
          error_message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          source_file: string
          cos_prefix?: string | null
          m3u8_path?: string | null
          duration?: number | null
          width?: number | null
          height?: number | null
          fps?: number | null
          segment_count?: number | null
          status?: string
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          source_file?: string
          cos_prefix?: string | null
          m3u8_path?: string | null
          duration?: number | null
          width?: number | null
          height?: number | null
          fps?: number | null
          segment_count?: number | null
          status?: string
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      video_access_logs: {
        Row: {
          id: number
          user_id: string
          video_id: string
          segment_name: string | null
          watch_seconds: number | null
          ip: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          video_id: string
          segment_name?: string | null
          watch_seconds?: number | null
          ip?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          video_id?: string
          segment_name?: string | null
          watch_seconds?: number | null
          ip?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_access_logs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          id: number
          user_id: string
          course_id: string | null
          lesson_id: string
          video_id: string | null
          current_seconds: number
          duration_seconds: number | null
          progress_percent: number
          is_completed: boolean
          completed_at: string | null
          last_watched_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          course_id?: string | null
          lesson_id: string
          video_id?: string | null
          current_seconds?: number
          duration_seconds?: number | null
          progress_percent?: number
          is_completed?: boolean
          completed_at?: string | null
          last_watched_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          course_id?: string | null
          lesson_id?: string
          video_id?: string | null
          current_seconds?: number
          duration_seconds?: number | null
          progress_percent?: number
          is_completed?: boolean
          completed_at?: string | null
          last_watched_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          id: number
          course_id: string
          user_id: string
          source: string
          status: string
          granted_by: string | null
          granted_at: string
          revoked_by: string | null
          revoked_at: string | null
          expires_at: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          course_id: string
          user_id: string
          source?: string
          status?: string
          granted_by?: string | null
          granted_at?: string
          revoked_by?: string | null
          revoked_at?: string | null
          expires_at?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          course_id?: string
          user_id?: string
          source?: string
          status?: string
          granted_by?: string | null
          granted_at?: string
          revoked_by?: string | null
          revoked_at?: string | null
          expires_at?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_purchase_requests: {
        Row: {
          id: number
          course_id: string
          course_title: string | null
          course_price: number | null
          user_id: string | null
          phone: string
          wechat: string
          note: string | null
          status: string
          admin_note: string | null
          contacted_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          course_id: string
          course_title?: string | null
          course_price?: number | null
          user_id?: string | null
          phone: string
          wechat: string
          note?: string | null
          status?: string
          admin_note?: string | null
          contacted_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          course_id?: string
          course_title?: string | null
          course_price?: number | null
          user_id?: string | null
          phone?: string
          wechat?: string
          note?: string | null
          status?: string
          admin_note?: string | null
          contacted_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_purchase_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchase_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
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

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
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_social_links: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          platform: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          platform: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          platform?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
          property_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
          property_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
          property_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          activity: string
          created_at: string
          email: string | null
          id: string
          phone: string | null
          problem: string
          rating: number
          role: string
          suggestions: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          activity: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          problem: string
          rating: number
          role: string
          suggestions?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          activity?: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          problem?: string
          rating?: number
          role?: string
          suggestions?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      homepage_banners: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
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
      newsletter_subscriptions: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          property_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          property_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          property_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          bio: string | null
          contact_phone_2: string | null
          county: string | null
          cover_photo_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_whatsapp: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          address?: string | null
          bio?: string | null
          contact_phone_2?: string | null
          county?: string | null
          cover_photo_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          profile_photo_url?: string | null
          role: Database["public"]["Enums"]["user_role"]
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_whatsapp?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          address?: string | null
          bio?: string | null
          contact_phone_2?: string | null
          county?: string | null
          cover_photo_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_whatsapp?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      promotion_requests: {
        Row: {
          admin_id: string | null
          admin_note: string | null
          created_at: string
          id: string
          payment_amount: number | null
          payment_confirmed_at: string | null
          payment_requested_at: string | null
          payment_status: string
          processed_at: string | null
          property_id: string
          reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          admin_note?: string | null
          created_at?: string
          id?: string
          payment_amount?: number | null
          payment_confirmed_at?: string | null
          payment_requested_at?: string | null
          payment_status?: string
          processed_at?: string | null
          property_id: string
          reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          admin_note?: string | null
          created_at?: string
          id?: string
          payment_amount?: number | null
          payment_confirmed_at?: string | null
          payment_requested_at?: string | null
          payment_status?: string
          processed_at?: string | null
          property_id?: string
          reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          contact_phone: string
          contact_phone_2: string | null
          county: string
          created_at: string
          description: string | null
          flagged_count: number | null
          id: string
          is_flagged: boolean
          is_promoted: boolean
          listing_type: Database["public"]["Enums"]["listing_type"]
          moderation_note: string | null
          moderation_status: string | null
          owner_id: string
          photos: string[]
          price_usd: number
          property_type: Database["public"]["Enums"]["property_type"]
          search_vector: unknown
          square_yards: number | null
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
          videos: string[] | null
        }
        Insert: {
          address: string
          bathrooms?: number | null
          bedrooms?: number | null
          contact_phone: string
          contact_phone_2?: string | null
          county: string
          created_at?: string
          description?: string | null
          flagged_count?: number | null
          id?: string
          is_flagged?: boolean
          is_promoted?: boolean
          listing_type: Database["public"]["Enums"]["listing_type"]
          moderation_note?: string | null
          moderation_status?: string | null
          owner_id: string
          photos: string[]
          price_usd: number
          property_type: Database["public"]["Enums"]["property_type"]
          search_vector?: unknown
          square_yards?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
          videos?: string[] | null
        }
        Update: {
          address?: string
          bathrooms?: number | null
          bedrooms?: number | null
          contact_phone?: string
          contact_phone_2?: string | null
          county?: string
          created_at?: string
          description?: string | null
          flagged_count?: number | null
          id?: string
          is_flagged?: boolean
          is_promoted?: boolean
          listing_type?: Database["public"]["Enums"]["listing_type"]
          moderation_note?: string | null
          moderation_status?: string | null
          owner_id?: string
          photos?: string[]
          price_usd?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          search_vector?: unknown
          square_yards?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
          videos?: string[] | null
        }
        Relationships: []
      }
      property_inquiries: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          property_id: string
          sender_email: string | null
          sender_id: string | null
          sender_name: string
          sender_phone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          property_id: string
          sender_email?: string | null
          sender_id?: string | null
          sender_name: string
          sender_phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          property_id?: string
          sender_email?: string | null
          sender_id?: string | null
          sender_name?: string
          sender_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_offers: {
        Row: {
          buyer_id: string | null
          buyer_name: string
          buyer_phone: string
          counter_amount_usd: number | null
          created_at: string
          id: string
          message: string | null
          offer_amount_usd: number
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          buyer_name: string
          buyer_phone: string
          counter_amount_usd?: number | null
          created_at?: string
          id?: string
          message?: string | null
          offer_amount_usd: number
          property_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          buyer_name?: string
          buyer_phone?: string
          counter_amount_usd?: number | null
          created_at?: string
          id?: string
          message?: string | null
          offer_amount_usd?: number
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reports: {
        Row: {
          admin_id: string | null
          admin_note: string | null
          created_at: string
          details: string | null
          id: string
          processed_at: string | null
          property_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          admin_id?: string | null
          admin_note?: string | null
          created_at?: string
          details?: string | null
          id?: string
          processed_at?: string | null
          property_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          admin_id?: string | null
          admin_note?: string | null
          created_at?: string
          details?: string | null
          id?: string
          processed_at?: string | null
          property_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_views: {
        Row: {
          id: string
          ip_address: string | null
          property_id: string
          user_agent: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          property_id: string
          user_agent?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          property_id?: string
          user_agent?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      recently_viewed: {
        Row: {
          id: string
          property_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          property_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          property_id: string | null
          rating: number
          reviewed_user_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          property_id?: string | null
          rating: number
          reviewed_user_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          property_id?: string | null
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          notify_new_matches: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          name: string
          notify_new_matches?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          notify_new_matches?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_id: string | null
          admin_note: string | null
          agency_logo: string | null
          agency_name: string | null
          business_phone: string | null
          created_at: string
          date_of_birth: string
          id: string
          id_images: string[]
          id_type: Database["public"]["Enums"]["id_type"]
          office_location: string | null
          processed_at: string | null
          selfie_image: string
          status: Database["public"]["Enums"]["verification_status"]
          user_id: string
          verification_type: string
        }
        Insert: {
          admin_id?: string | null
          admin_note?: string | null
          agency_logo?: string | null
          agency_name?: string | null
          business_phone?: string | null
          created_at?: string
          date_of_birth: string
          id?: string
          id_images: string[]
          id_type: Database["public"]["Enums"]["id_type"]
          office_location?: string | null
          processed_at?: string | null
          selfie_image: string
          status?: Database["public"]["Enums"]["verification_status"]
          user_id: string
          verification_type?: string
        }
        Update: {
          admin_id?: string | null
          admin_note?: string | null
          agency_logo?: string | null
          agency_name?: string | null
          business_phone?: string | null
          created_at?: string
          date_of_birth?: string
          id?: string
          id_images?: string[]
          id_type?: Database["public"]["Enums"]["id_type"]
          office_location?: string | null
          processed_at?: string | null
          selfie_image?: string
          status?: Database["public"]["Enums"]["verification_status"]
          user_id?: string
          verification_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_views: { Args: { post_id: string }; Returns: undefined }
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      id_type: "citizen_card" | "voter_card" | "passport" | "drivers_license"
      listing_type: "for_sale" | "for_rent" | "for_lease"
      property_status: "active" | "inactive" | "sold" | "rented"
      property_type: "house" | "apartment" | "shop"
      user_role: "property_owner" | "agent"
      verification_status: "none" | "pending" | "approved" | "rejected"
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
      id_type: ["citizen_card", "voter_card", "passport", "drivers_license"],
      listing_type: ["for_sale", "for_rent", "for_lease"],
      property_status: ["active", "inactive", "sold", "rented"],
      property_type: ["house", "apartment", "shop"],
      user_role: ["property_owner", "agent"],
      verification_status: ["none", "pending", "approved", "rejected"],
    },
  },
} as const

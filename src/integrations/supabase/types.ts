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
      county_insights: {
        Row: {
          avg_household_income: string | null
          avg_property_price: string | null
          clinics_count: number | null
          county: string
          created_at: string
          employment_rate: string | null
          highlights: string[]
          hospitals_count: number | null
          id: string
          image_url: string | null
          livability_score: number | null
          markets_count: number | null
          overview: string | null
          parks_count: number | null
          population: string | null
          public_transport: string | null
          restaurants_count: number | null
          schools_count: number | null
          shopping_centers_count: number | null
          updated_at: string
        }
        Insert: {
          avg_household_income?: string | null
          avg_property_price?: string | null
          clinics_count?: number | null
          county: string
          created_at?: string
          employment_rate?: string | null
          highlights?: string[]
          hospitals_count?: number | null
          id?: string
          image_url?: string | null
          livability_score?: number | null
          markets_count?: number | null
          overview?: string | null
          parks_count?: number | null
          population?: string | null
          public_transport?: string | null
          restaurants_count?: number | null
          schools_count?: number | null
          shopping_centers_count?: number | null
          updated_at?: string
        }
        Update: {
          avg_household_income?: string | null
          avg_property_price?: string | null
          clinics_count?: number | null
          county?: string
          created_at?: string
          employment_rate?: string | null
          highlights?: string[]
          hospitals_count?: number | null
          id?: string
          image_url?: string | null
          livability_score?: number | null
          markets_count?: number | null
          overview?: string | null
          parks_count?: number | null
          population?: string | null
          public_transport?: string | null
          restaurants_count?: number | null
          schools_count?: number | null
          shopping_centers_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          level: string
          message: string
          route: string | null
          stack: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message: string
          route?: string | null
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          route?: string | null
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      hotel_bookings: {
        Row: {
          admin_notes: string | null
          check_in: string
          check_in_code: string | null
          check_out: string
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string
          guest_details: Json | null
          guest_email: string | null
          guest_id: string | null
          guest_name: string
          guest_phone: string
          guests: number
          hotel_id: string
          id: string
          payment_method: string
          payment_reference: string | null
          room_id: string
          rooms: number
          service_fee: number
          status: string
          subtotal: number
          taxes: number
          total: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          check_in: string
          check_in_code?: string | null
          check_out: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          guest_details?: Json | null
          guest_email?: string | null
          guest_id?: string | null
          guest_name: string
          guest_phone: string
          guests?: number
          hotel_id: string
          id?: string
          payment_method: string
          payment_reference?: string | null
          room_id: string
          rooms?: number
          service_fee?: number
          status?: string
          subtotal: number
          taxes?: number
          total: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          check_in?: string
          check_in_code?: string | null
          check_out?: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          guest_details?: Json | null
          guest_email?: string | null
          guest_id?: string | null
          guest_name?: string
          guest_phone?: string
          guests?: number
          hotel_id?: string
          id?: string
          payment_method?: string
          payment_reference?: string | null
          room_id?: string
          rooms?: number
          service_fee?: number
          status?: string
          subtotal?: number
          taxes?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_bookings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hotel_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_pricing_rules: {
        Row: {
          created_at: string
          early_bird_days: number
          early_bird_pct: number
          hotel_id: string
          id: string
          last_minute_days: number
          last_minute_pct: number
          los_discount_pct: number
          los_min_nights: number
          updated_at: string
          weekend_days: number[]
          weekend_surcharge_pct: number
        }
        Insert: {
          created_at?: string
          early_bird_days?: number
          early_bird_pct?: number
          hotel_id: string
          id?: string
          last_minute_days?: number
          last_minute_pct?: number
          los_discount_pct?: number
          los_min_nights?: number
          updated_at?: string
          weekend_days?: number[]
          weekend_surcharge_pct?: number
        }
        Update: {
          created_at?: string
          early_bird_days?: number
          early_bird_pct?: number
          hotel_id?: string
          id?: string
          last_minute_days?: number
          last_minute_pct?: number
          los_discount_pct?: number
          los_min_nights?: number
          updated_at?: string
          weekend_days?: number[]
          weekend_surcharge_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "hotel_pricing_rules_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: true
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          flag_reason: string | null
          guest_id: string | null
          guest_name: string | null
          hotel_id: string
          id: string
          is_flagged: boolean
          owner_reply: string | null
          owner_reply_at: string | null
          rating: number
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          flag_reason?: string | null
          guest_id?: string | null
          guest_name?: string | null
          hotel_id: string
          id?: string
          is_flagged?: boolean
          owner_reply?: string | null
          owner_reply_at?: string | null
          rating: number
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          flag_reason?: string | null
          guest_id?: string | null
          guest_name?: string | null
          hotel_id?: string
          id?: string
          is_flagged?: boolean
          owner_reply?: string | null
          owner_reply_at?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "hotel_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "hotel_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_reviews_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_rooms: {
        Row: {
          amenities: Json | null
          bed_type: string | null
          created_at: string
          description: string | null
          guests: number
          hotel_id: string
          id: string
          is_active: boolean | null
          is_most_popular: boolean | null
          name: string
          photos: string[] | null
          price_per_night: number
          size_sqm: number | null
          tour_360_url: string | null
          updated_at: string
        }
        Insert: {
          amenities?: Json | null
          bed_type?: string | null
          created_at?: string
          description?: string | null
          guests?: number
          hotel_id: string
          id?: string
          is_active?: boolean | null
          is_most_popular?: boolean | null
          name: string
          photos?: string[] | null
          price_per_night: number
          size_sqm?: number | null
          tour_360_url?: string | null
          updated_at?: string
        }
        Update: {
          amenities?: Json | null
          bed_type?: string | null
          created_at?: string
          description?: string | null
          guests?: number
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          is_most_popular?: boolean | null
          name?: string
          photos?: string[] | null
          price_per_night?: number
          size_sqm?: number | null
          tour_360_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          about: string | null
          address: string
          amenities: Json | null
          check_in_time: string
          check_out_time: string
          city: string | null
          county: string
          cover_photo: string | null
          created_at: string
          description: string | null
          district: string | null
          gallery: string[] | null
          id: string
          is_verified: boolean | null
          name: string
          nearby_places: Json
          owner_id: string
          phone: string | null
          rating_count: number | null
          star_rating: number | null
          status: string
          top_amenities: Json
          total_rooms: number
          updated_at: string
          why_guests_love: Json
        }
        Insert: {
          about?: string | null
          address: string
          amenities?: Json | null
          check_in_time?: string
          check_out_time?: string
          city?: string | null
          county: string
          cover_photo?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          gallery?: string[] | null
          id?: string
          is_verified?: boolean | null
          name: string
          nearby_places?: Json
          owner_id: string
          phone?: string | null
          rating_count?: number | null
          star_rating?: number | null
          status?: string
          top_amenities?: Json
          total_rooms?: number
          updated_at?: string
          why_guests_love?: Json
        }
        Update: {
          about?: string | null
          address?: string
          amenities?: Json | null
          check_in_time?: string
          check_out_time?: string
          city?: string | null
          county?: string
          cover_photo?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          gallery?: string[] | null
          id?: string
          is_verified?: boolean | null
          name?: string
          nearby_places?: Json
          owner_id?: string
          phone?: string | null
          rating_count?: number | null
          star_rating?: number | null
          status?: string
          top_amenities?: Json
          total_rooms?: number
          updated_at?: string
          why_guests_love?: Json
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
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          inquiries: boolean
          marketing: boolean
          messages: boolean
          offers: boolean
          status_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inquiries?: boolean
          marketing?: boolean
          messages?: boolean
          offers?: boolean
          status_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inquiries?: boolean
          marketing?: boolean
          messages?: boolean
          offers?: boolean
          status_updates?: boolean
          updated_at?: string
          user_id?: string
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
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          property_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          property_id?: string | null
          title?: string
          type?: string
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
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          bio: string | null
          buyer_verified: boolean
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
          buyer_verified?: boolean
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
          buyer_verified?: boolean
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
          duration_months: number | null
          id: string
          payment_amount: number | null
          payment_confirmed_at: string | null
          payment_reference: string | null
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
          duration_months?: number | null
          id?: string
          payment_amount?: number | null
          payment_confirmed_at?: string | null
          payment_reference?: string | null
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
          duration_months?: number | null
          id?: string
          payment_amount?: number | null
          payment_confirmed_at?: string | null
          payment_reference?: string | null
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
          boundary_marked: boolean | null
          city: string | null
          community: string | null
          contact_phone: string
          contact_phone_2: string | null
          county: string
          created_at: string
          description: string | null
          district: string | null
          flagged_count: number | null
          id: string
          is_flagged: boolean
          is_promoted: boolean
          land_size: number | null
          land_size_unit: string | null
          land_use: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          moderation_note: string | null
          moderation_status: string | null
          nearest_landmark: string | null
          owner_id: string
          photos: string[]
          price_usd: number
          promotion_impression_count: number
          property_type: Database["public"]["Enums"]["property_type"]
          rent_period: string | null
          road_access: boolean | null
          search_vector: unknown
          square_yards: number | null
          status: Database["public"]["Enums"]["property_status"]
          street: string | null
          title: string
          title_deed_status: string | null
          topography: string | null
          updated_at: string
          utilities_nearby: string[] | null
          videos: string[] | null
          zoning: string | null
        }
        Insert: {
          address: string
          bathrooms?: number | null
          bedrooms?: number | null
          boundary_marked?: boolean | null
          city?: string | null
          community?: string | null
          contact_phone: string
          contact_phone_2?: string | null
          county: string
          created_at?: string
          description?: string | null
          district?: string | null
          flagged_count?: number | null
          id?: string
          is_flagged?: boolean
          is_promoted?: boolean
          land_size?: number | null
          land_size_unit?: string | null
          land_use?: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          moderation_note?: string | null
          moderation_status?: string | null
          nearest_landmark?: string | null
          owner_id: string
          photos: string[]
          price_usd: number
          promotion_impression_count?: number
          property_type: Database["public"]["Enums"]["property_type"]
          rent_period?: string | null
          road_access?: boolean | null
          search_vector?: unknown
          square_yards?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          street?: string | null
          title: string
          title_deed_status?: string | null
          topography?: string | null
          updated_at?: string
          utilities_nearby?: string[] | null
          videos?: string[] | null
          zoning?: string | null
        }
        Update: {
          address?: string
          bathrooms?: number | null
          bedrooms?: number | null
          boundary_marked?: boolean | null
          city?: string | null
          community?: string | null
          contact_phone?: string
          contact_phone_2?: string | null
          county?: string
          created_at?: string
          description?: string | null
          district?: string | null
          flagged_count?: number | null
          id?: string
          is_flagged?: boolean
          is_promoted?: boolean
          land_size?: number | null
          land_size_unit?: string | null
          land_use?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          moderation_note?: string | null
          moderation_status?: string | null
          nearest_landmark?: string | null
          owner_id?: string
          photos?: string[]
          price_usd?: number
          promotion_impression_count?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          rent_period?: string | null
          road_access?: boolean | null
          search_vector?: unknown
          square_yards?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          street?: string | null
          title?: string
          title_deed_status?: string | null
          topography?: string | null
          updated_at?: string
          utilities_nearby?: string[] | null
          videos?: string[] | null
          zoning?: string | null
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
      property_inspections: {
        Row: {
          admin_notes: string | null
          assigned_at: string | null
          completed_at: string | null
          created_at: string
          fee_usd: number
          form_data: Json
          id: string
          inspection_type: string
          inspector_name: string | null
          inspector_phone: string | null
          payment_confirmed_at: string | null
          payment_reference: string | null
          payment_status: string
          payment_submitted_at: string | null
          property_id: string
          report_notes: string | null
          report_photos: string[] | null
          report_url: string | null
          report_video_url: string | null
          requester_email: string | null
          requester_id: string | null
          requester_name: string
          requester_phone: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string
          fee_usd: number
          form_data?: Json
          id?: string
          inspection_type: string
          inspector_name?: string | null
          inspector_phone?: string | null
          payment_confirmed_at?: string | null
          payment_reference?: string | null
          payment_status?: string
          payment_submitted_at?: string | null
          property_id: string
          report_notes?: string | null
          report_photos?: string[] | null
          report_url?: string | null
          report_video_url?: string | null
          requester_email?: string | null
          requester_id?: string | null
          requester_name: string
          requester_phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string
          fee_usd?: number
          form_data?: Json
          id?: string
          inspection_type?: string
          inspector_name?: string | null
          inspector_phone?: string | null
          payment_confirmed_at?: string | null
          payment_reference?: string | null
          payment_status?: string
          payment_submitted_at?: string | null
          property_id?: string
          report_notes?: string | null
          report_photos?: string[] | null
          report_url?: string | null
          report_video_url?: string | null
          requester_email?: string | null
          requester_id?: string | null
          requester_name?: string
          requester_phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_inspections_property_id_fkey"
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
      room_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          is_blocked: boolean
          note: string | null
          price_override: number | null
          room_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_blocked?: boolean
          note?: string | null
          price_override?: number | null
          room_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_blocked?: boolean
          note?: string | null
          price_override?: number | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_availability_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hotel_rooms"
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
      user_preferences: {
        Row: {
          created_at: string
          currency_display: string
          default_county: string | null
          default_listing_type: string | null
          default_property_type: string | null
          default_sort_order: string
          id: string
          show_email: boolean
          show_location: boolean
          show_phone: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency_display?: string
          default_county?: string | null
          default_listing_type?: string | null
          default_property_type?: string | null
          default_sort_order?: string
          id?: string
          show_email?: boolean
          show_location?: boolean
          show_phone?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency_display?: string
          default_county?: string | null
          default_listing_type?: string | null
          default_property_type?: string | null
          default_sort_order?: string
          id?: string
          show_email?: boolean
          show_location?: boolean
          show_phone?: boolean
          updated_at?: string
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
          business_license_no: string | null
          business_license_photo: string | null
          business_phone: string | null
          created_at: string
          date_of_birth: string | null
          expires_at: string | null
          hotel_name: string | null
          id: string
          id_images: string[] | null
          id_type: Database["public"]["Enums"]["id_type"] | null
          is_renewal: boolean
          office_location: string | null
          ownership_proof_photo: string | null
          payment_amount: number | null
          payment_confirmed_at: string | null
          payment_reference: string | null
          payment_requested_at: string | null
          payment_status: string
          processed_at: string | null
          selfie_image: string
          status: Database["public"]["Enums"]["verification_status"]
          tin_number: string | null
          user_id: string
          verification_type: string
        }
        Insert: {
          admin_id?: string | null
          admin_note?: string | null
          agency_logo?: string | null
          agency_name?: string | null
          business_license_no?: string | null
          business_license_photo?: string | null
          business_phone?: string | null
          created_at?: string
          date_of_birth?: string | null
          expires_at?: string | null
          hotel_name?: string | null
          id?: string
          id_images?: string[] | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          is_renewal?: boolean
          office_location?: string | null
          ownership_proof_photo?: string | null
          payment_amount?: number | null
          payment_confirmed_at?: string | null
          payment_reference?: string | null
          payment_requested_at?: string | null
          payment_status?: string
          processed_at?: string | null
          selfie_image: string
          status?: Database["public"]["Enums"]["verification_status"]
          tin_number?: string | null
          user_id: string
          verification_type?: string
        }
        Update: {
          admin_id?: string | null
          admin_note?: string | null
          agency_logo?: string | null
          agency_name?: string | null
          business_license_no?: string | null
          business_license_photo?: string | null
          business_phone?: string | null
          created_at?: string
          date_of_birth?: string | null
          expires_at?: string | null
          hotel_name?: string | null
          id?: string
          id_images?: string[] | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          is_renewal?: boolean
          office_location?: string | null
          ownership_proof_photo?: string | null
          payment_amount?: number | null
          payment_confirmed_at?: string | null
          payment_reference?: string | null
          payment_requested_at?: string | null
          payment_status?: string
          processed_at?: string | null
          selfie_image?: string
          status?: Database["public"]["Enums"]["verification_status"]
          tin_number?: string | null
          user_id?: string
          verification_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      agent_leaderboard: {
        Row: {
          active_listings: number | null
          agency_logo: string | null
          agency_name: string | null
          avg_rating: number | null
          bio: string | null
          county: string | null
          id: string | null
          name: string | null
          phone: string | null
          profile_photo_url: string | null
          reviews_count: number | null
          score: number | null
          total_views: number | null
        }
        Relationships: []
      }
      property_views_safe: {
        Row: {
          id: string | null
          property_id: string | null
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          id?: string | null
          property_id?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          id?: string | null
          property_id?: string | null
          viewed_at?: string | null
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
      public_owner_profiles: {
        Row: {
          bio: string | null
          county: string | null
          cover_photo_url: string | null
          created_at: string | null
          id: string | null
          name: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_whatsapp: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          bio?: string | null
          county?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_whatsapp?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          bio?: string | null
          county?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_whatsapp?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          bio: string | null
          county: string | null
          cover_photo_url: string | null
          created_at: string | null
          id: string | null
          name: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_whatsapp: string | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          bio?: string | null
          county?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_whatsapp?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          bio?: string | null
          county?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_whatsapp?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
    }
    Functions: {
      count_properties_filtered: {
        Args: {
          _county?: string
          _listing_type?: string
          _max_price?: number
          _min_price?: number
          _only_promoted?: boolean
          _owner_id?: string
          _property_type?: string
          _search?: string
        }
        Returns: number
      }
      expire_my_verification_if_due: { Args: never; Returns: undefined }
      get_property_view_counts: {
        Args: { p_property_ids: string[] }
        Returns: {
          property_id: string
          view_count: number
        }[]
      }
      get_round_robin_promoted: {
        Args: { limit_count?: number }
        Returns: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          boundary_marked: boolean | null
          city: string | null
          community: string | null
          contact_phone: string
          contact_phone_2: string | null
          county: string
          created_at: string
          description: string | null
          district: string | null
          flagged_count: number | null
          id: string
          is_flagged: boolean
          is_promoted: boolean
          land_size: number | null
          land_size_unit: string | null
          land_use: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          moderation_note: string | null
          moderation_status: string | null
          nearest_landmark: string | null
          owner_id: string
          photos: string[]
          price_usd: number
          promotion_impression_count: number
          property_type: Database["public"]["Enums"]["property_type"]
          rent_period: string | null
          road_access: boolean | null
          search_vector: unknown
          square_yards: number | null
          status: Database["public"]["Enums"]["property_status"]
          street: string | null
          title: string
          title_deed_status: string | null
          topography: string | null
          updated_at: string
          utilities_nearby: string[] | null
          videos: string[] | null
          zoning: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "properties"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      increment_views: { Args: { post_id: string }; Returns: undefined }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      list_properties_shuffled: {
        Args: {
          _county?: string
          _from?: number
          _listing_type?: string
          _max_price?: number
          _min_price?: number
          _only_promoted?: boolean
          _owner_id?: string
          _property_type?: string
          _search?: string
          _seed: string
          _sort?: string
          _to?: number
        }
        Returns: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          boundary_marked: boolean | null
          city: string | null
          community: string | null
          contact_phone: string
          contact_phone_2: string | null
          county: string
          created_at: string
          description: string | null
          district: string | null
          flagged_count: number | null
          id: string
          is_flagged: boolean
          is_promoted: boolean
          land_size: number | null
          land_size_unit: string | null
          land_use: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          moderation_note: string | null
          moderation_status: string | null
          nearest_landmark: string | null
          owner_id: string
          photos: string[]
          price_usd: number
          promotion_impression_count: number
          property_type: Database["public"]["Enums"]["property_type"]
          rent_period: string | null
          road_access: boolean | null
          search_vector: unknown
          square_yards: number | null
          status: Database["public"]["Enums"]["property_status"]
          street: string | null
          title: string
          title_deed_status: string | null
          topography: string | null
          updated_at: string
          utilities_nearby: string[] | null
          videos: string[] | null
          zoning: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "properties"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_messages_read: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
      notify_all_admins: {
        Args: {
          p_message: string
          p_property_id?: string
          p_title: string
          p_type?: string
        }
        Returns: undefined
      }
      set_inspection_payment_status: {
        Args: { p_inspection_id: string; p_note?: string; p_status: string }
        Returns: undefined
      }
      submit_inspection_payment_reference: {
        Args: { p_inspection_id: string; p_ref: string; p_sender_name: string }
        Returns: undefined
      }
      submit_verification_payment_reference: {
        Args: { p_ref: string; p_request_id: string; p_sender_name: string }
        Returns: undefined
      }
      user_wants_notification: {
        Args: { p_type: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      id_type: "citizen_card" | "voter_card" | "passport" | "drivers_license"
      listing_type: "for_sale" | "for_rent" | "for_lease"
      property_status: "active" | "inactive" | "sold" | "rented"
      property_type: "house" | "apartment" | "shop" | "land"
      user_role: "property_owner" | "agent" | "hotel" | "customer"
      verification_status:
        | "none"
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
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
      property_type: ["house", "apartment", "shop", "land"],
      user_role: ["property_owner", "agent", "hotel", "customer"],
      verification_status: [
        "none",
        "pending",
        "approved",
        "rejected",
        "expired",
      ],
    },
  },
} as const

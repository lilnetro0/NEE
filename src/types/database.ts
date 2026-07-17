/**
 * Hand-maintained Supabase Database types for NETRO commerce.
 * Regenerate with `supabase gen types typescript` when the remote schema changes.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          email: string | null;
          phone: string | null;
          country_code: string;
          preferred_currency: string;
          preferred_locale: string;
          avatar_path: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name_en: string;
          name_ar: string;
          slug: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["categories"]["Row"];
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name_en: string;
          name_ar: string;
          slug: string;
          color: string;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["brands"]["Row"];
        Update: Partial<Database["public"]["Tables"]["brands"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          kind: "gift_card" | "direct_topup";
          brand_id: string;
          category_id: string;
          title_en: string;
          title_ar: string;
          subtitle_en: string | null;
          subtitle_ar: string | null;
          description_en: string;
          description_ar: string;
          color: string;
          rating: number;
          reviews_count: number;
          in_stock: boolean;
          tags: string[];
          from_price: number;
          compare_at: number | null;
          display_currency: string;
          region_code: string;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["products"]["Row"];
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [];
      };
      denominations: {
        Row: {
          id: string;
          product_id: string;
          face_value: number;
          price: number;
          in_stock: boolean;
        };
        Insert: Database["public"]["Tables"]["denominations"]["Row"];
        Update: Partial<Database["public"]["Tables"]["denominations"]["Row"]>;
        Relationships: [];
      };
      topup_packages: {
        Row: {
          id: string;
          product_id: string;
          label: string;
          amount: number;
          price: number;
          in_stock: boolean;
          bonus_en: string | null;
          bonus_ar: string | null;
        };
        Insert: Database["public"]["Tables"]["topup_packages"]["Row"];
        Update: Partial<Database["public"]["Tables"]["topup_packages"]["Row"]>;
        Relationships: [];
      };
      product_required_fields: {
        Row: {
          id: string;
          product_id: string;
          field_key: string;
          field_schema: Json;
        };
        Insert: Database["public"]["Tables"]["product_required_fields"]["Row"];
        Update: Partial<Database["public"]["Tables"]["product_required_fields"]["Row"]>;
        Relationships: [];
      };
      checkout_quotes: {
        Row: {
          id: string;
          user_id: string | null;
          country: string;
          payment_currency: string;
          display_currency: string;
          region_code: string;
          promo_code: string | null;
          availability_status: "available" | "price_changed" | "product_unavailable" | "expired";
          subtotal: number;
          discount: number;
          tax: number;
          fees: number;
          total: number;
          warnings: Json;
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["checkout_quotes"]["Row"]> & {
          country: string;
          payment_currency: string;
          display_currency: string;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["checkout_quotes"]["Row"]>;
        Relationships: [];
      };
      checkout_quote_items: {
        Row: {
          id: string;
          quote_id: string;
          product_id: string;
          sku: string;
          title_en: string;
          title_ar: string;
          quantity: number;
          unit_price: number;
          client_unit_price: number | null;
          total_price: number;
          currency: string;
          region_code: string;
          region_label_en: string;
          region_label_ar: string;
          redemption_currency: string | null;
          available: boolean;
          fulfillment_fields: Json;
        };
        Insert: Omit<Database["public"]["Tables"]["checkout_quote_items"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["checkout_quote_items"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          quote_id: string | null;
          payment_status:
            | "pending_payment"
            | "payment_processing"
            | "paid"
            | "failed"
            | "cancelled"
            | "refunded";
          fulfillment_status:
            | "not_started"
            | "fulfillment_pending"
            | "processing"
            | "fulfilled"
            | "partially_fulfilled"
            | "failed"
            | "manual_review";
          refund_status:
            | "none"
            | "requested"
            | "reviewing"
            | "approved"
            | "rejected"
            | "processing"
            | "completed";
          payment_method: string | null;
          payment_currency: string;
          display_currency: string;
          country: string;
          subtotal: number;
          discount: number;
          tax: number;
          fees: number;
          total: number;
          idempotency_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          user_id: string;
          payment_currency: string;
          display_currency: string;
          country: string;
          subtotal: number;
          total: number;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          item_index: number;
          product_id: string;
          kind: "gift_card" | "direct_topup";
          sku: string;
          title_en: string;
          title_ar: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          currency: string;
          fulfillment_fields: Json;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title_en: string;
          title_ar: string;
          body_en: string;
          body_ar: string;
          type: "order" | "promo" | "security" | "support";
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      promotions: {
        Row: {
          id: string;
          code: string;
          title_en: string;
          title_ar: string;
          expires_label_en: string;
          expires_label_ar: string;
          expires_at: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["promotions"]["Row"];
        Update: Partial<Database["public"]["Tables"]["promotions"]["Row"]>;
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          reason: string;
          order_id: string | null;
          order_item_id: string | null;
          description: string;
          attachment: Json | null;
          preferred_contact_method: string;
          internal_metadata: Json;
          status: "open" | "waiting_for_customer" | "in_progress" | "resolved" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["support_tickets"]["Row"],
          "id" | "created_at" | "updated_at" | "status"
        > & {
          id?: string;
          status?: Database["public"]["Tables"]["support_tickets"]["Row"]["status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]>;
        Relationships: [];
      };
      store_credits: {
        Row: {
          user_id: string;
          balance: number;
          currency: string;
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["store_credits"]["Row"];
        Update: Partial<Database["public"]["Tables"]["store_credits"]["Row"]>;
        Relationships: [];
      };
      device_sessions: {
        Row: {
          id: string;
          user_id: string;
          device: string;
          location: string;
          last_active: string;
          refresh_jti: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["device_sessions"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["device_sessions"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Enums: {
      product_kind: "gift_card" | "direct_topup";
      payment_status:
        | "pending_payment"
        | "payment_processing"
        | "paid"
        | "failed"
        | "cancelled"
        | "refunded";
      fulfillment_status:
        | "not_started"
        | "fulfillment_pending"
        | "processing"
        | "fulfilled"
        | "partially_fulfilled"
        | "failed"
        | "manual_review";
    };
  };
};

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
          account_status: "active" | "suspended" | "banned";
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
          image_path: string | null;
          is_hidden: boolean;
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
          image_path: string | null;
          is_hidden: boolean;
          primary_category_id: string | null;
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
          region_id: string;
          payload: Json;
          is_visible: boolean;
          is_featured: boolean;
          is_archived: boolean;
          sort_order: number;
          image_path: string | null;
          seo_title_en: string | null;
          seo_title_ar: string | null;
          seo_description_en: string | null;
          seo_description_ar: string | null;
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
          sort_order: number;
          is_active: boolean;
          label_en: string | null;
          label_ar: string | null;
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
          sort_order: number;
          is_active: boolean;
        };
        Insert: Database["public"]["Tables"]["topup_packages"]["Row"];
        Update: Partial<Database["public"]["Tables"]["topup_packages"]["Row"]>;
        Relationships: [];
      };
      regions: {
        Row: {
          code: string;
          name_en: string;
          name_ar: string;
          currency_code: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["regions"]["Row"];
        Update: Partial<Database["public"]["Tables"]["regions"]["Row"]>;
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
            "pending_payment" | "payment_processing" | "paid" | "failed" | "cancelled" | "refunded";
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
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["support_tickets"]["Row"],
          "id" | "created_at" | "updated_at" | "status" | "assigned_to"
        > & {
          id?: string;
          status?: Database["public"]["Tables"]["support_tickets"]["Row"]["status"];
          assigned_to?: string | null;
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
        Insert: Omit<
          Database["public"]["Tables"]["device_sessions"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["device_sessions"]["Row"]>;
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          code: string;
          name: string;
          priority: number;
          is_active: boolean;
          adapter_code: string;
          metadata: Json;
          credentials_secret_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["suppliers"]["Row"]> & {
          code: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Row"]>;
        Relationships: [];
      };
      supplier_products: {
        Row: {
          id: string;
          supplier_id: string;
          supplier_product_id: string;
          supplier_sku: string | null;
          supplier_cost: number | null;
          currency: string;
          country: string | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["supplier_products"]["Row"]> & {
          supplier_id: string;
          supplier_product_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["supplier_products"]["Row"]>;
        Relationships: [];
      };
      supplier_product_mappings: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          supplier_id: string;
          supplier_product_ref: string;
          supplier_product_row_id: string | null;
          supplier_sku: string | null;
          supplier_cost: number | null;
          currency: string;
          country: string | null;
          priority: number;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["supplier_product_mappings"]["Row"]> & {
          product_id: string;
          sku: string;
          supplier_id: string;
          supplier_product_ref: string;
        };
        Update: Partial<Database["public"]["Tables"]["supplier_product_mappings"]["Row"]>;
        Relationships: [];
      };
      fulfillment_attempts: {
        Row: {
          id: string;
          order_id: string;
          order_item_id: string;
          status: Database["public"]["Enums"]["fulfillment_status"];
          provider: string;
          provider_ref: string | null;
          error_message: string | null;
          supplier_id: string | null;
          supplier_product_ref: string | null;
          attempt_number: number;
          request_id: string | null;
          safe_request: Json;
          safe_response: Json;
          error_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["fulfillment_attempts"]["Row"]> & {
          order_id: string;
          order_item_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["fulfillment_attempts"]["Row"]>;
        Relationships: [];
      };
      supplier_webhook_events: {
        Row: {
          id: string;
          supplier_id: string | null;
          event_type: string;
          provider_event_id: string | null;
          payload: Json;
          status: "received" | "processing" | "processed" | "ignored" | "failed";
          error_message: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["supplier_webhook_events"]["Row"]> & {
          event_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["supplier_webhook_events"]["Row"]>;
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Database["public"]["Tables"]["app_settings"]["Row"];
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Row"]>;
        Relationships: [];
      };
      admin_roles: {
        Row: {
          id: string;
          name_en: string;
          name_ar: string;
          description: string | null;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["admin_roles"]["Row"];
        Update: Partial<Database["public"]["Tables"]["admin_roles"]["Row"]>;
        Relationships: [];
      };
      admin_role_permissions: {
        Row: { role_id: string; permission: string };
        Insert: Database["public"]["Tables"]["admin_role_permissions"]["Row"];
        Update: Partial<Database["public"]["Tables"]["admin_role_permissions"]["Row"]>;
        Relationships: [];
      };
      admin_user_roles: {
        Row: { user_id: string; role_id: string; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["admin_user_roles"]["Row"]> & {
          user_id: string;
          role_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_user_roles"]["Row"]>;
        Relationships: [];
      };
      support_ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string | null;
          author_role: "customer" | "admin" | "system";
          body: string;
          attachment_path: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["support_ticket_messages"]["Row"]> & {
          ticket_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_ticket_messages"]["Row"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & {
          action: string;
          entity_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      admin_product_variants: {
        Row: {
          sku: string;
          product_id: string;
          product_kind: "gift_card" | "direct_topup";
          variant_kind: string;
          label_en: string;
          label_ar: string;
          amount: number;
          price: number;
          in_stock: boolean;
          is_active: boolean;
          sort_order: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Enums: {
      product_kind: "gift_card" | "direct_topup";
      payment_status:
        "pending_payment" | "payment_processing" | "paid" | "failed" | "cancelled" | "refunded";
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

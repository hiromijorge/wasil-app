export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      platform_config: {
        Row: {
          id: number;
          transaction_fee_usd: number;
          commission_percent: number;
          minimum_commission_sar: number;
          partner_commission_percent: number;
          updated_at: string;
          parcel_base_fare_sar: number;
          parcel_per_km_rate_sar: number;
          parcel_per_kg_rate_sar: number;
          parcel_volumetric_divisor: number;
          minimum_parcel_fare_sar: number;
          parcel_bike_multiplier: number;
          parcel_car_multiplier: number;
          parcel_van_multiplier: number;
          min_partner_payout_sar: number;
          min_merchant_payout_sar: number;
          min_driver_payout_sar: number;
          cod_weekly_settlement_days: number;
          cod_max_unsettled_cash_sar: number;
          cod_high_value_threshold_sar: number;
          parcel_driver_fee_percent: number;
        };
        Insert: {
          id?: number;
          transaction_fee_usd?: number;
          commission_percent?: number;
          minimum_commission_sar?: number;
          partner_commission_percent?: number;
          updated_at?: string;
          parcel_base_fare_sar?: number;
          parcel_per_km_rate_sar?: number;
          parcel_per_kg_rate_sar?: number;
          parcel_volumetric_divisor?: number;
          minimum_parcel_fare_sar?: number;
          parcel_bike_multiplier?: number;
          parcel_car_multiplier?: number;
          parcel_van_multiplier?: number;
          min_partner_payout_sar?: number;
          min_merchant_payout_sar?: number;
          min_driver_payout_sar?: number;
          cod_weekly_settlement_days?: number;
          cod_max_unsettled_cash_sar?: number;
          cod_high_value_threshold_sar?: number;
          parcel_driver_fee_percent?: number;
        };
        Update: {
          id?: number;
          transaction_fee_usd?: number;
          commission_percent?: number;
          minimum_commission_sar?: number;
          partner_commission_percent?: number;
          updated_at?: string;
          parcel_base_fare_sar?: number;
          parcel_per_km_rate_sar?: number;
          parcel_per_kg_rate_sar?: number;
          parcel_volumetric_divisor?: number;
          minimum_parcel_fare_sar?: number;
          parcel_bike_multiplier?: number;
          parcel_car_multiplier?: number;
          parcel_van_multiplier?: number;
          min_partner_payout_sar?: number;
          min_merchant_payout_sar?: number;
          min_driver_payout_sar?: number;
          cod_weekly_settlement_days?: number;
          cod_max_unsettled_cash_sar?: number;
          cod_high_value_threshold_sar?: number;
          parcel_driver_fee_percent?: number;
        };
      };
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: "customer" | "merchant" | "driver" | "admin" | "partner";
          referral_code: string | null;
          referred_by: string | null;
          is_partner: boolean;
          push_token: string | null;
          language: string | null;
          payout_details: import("./database.types").Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "customer" | "merchant" | "driver" | "admin" | "partner";
          referral_code?: string | null;
          referred_by?: string | null;
          is_partner?: boolean;
          push_token?: string | null;
          language?: string | null;
          payout_details?: import("./database.types").Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string | null;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "customer" | "merchant" | "driver" | "admin" | "partner";
          referral_code?: string | null;
          referred_by?: string | null;
          is_partner?: boolean;
          push_token?: string | null;
          language?: string | null;
          payout_details?: import("./database.types").Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          address: string;
          lat: number | null;
          lng: number | null;
          building_floor: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          address: string;
          lat?: number | null;
          lng?: number | null;
          building_floor?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          address?: string;
          lat?: number | null;
          lng?: number | null;
          building_floor?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          name: string;
          bank_name: string;
          account_number: string;
          account_holder: string;
          branch: string | null;
          is_default: boolean;
          for_payouts: boolean;
          for_receipts: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          bank_name: string;
          account_number: string;
          account_holder: string;
          branch?: string | null;
          is_default?: boolean;
          for_payouts?: boolean;
          for_receipts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          bank_name?: string;
          account_number?: string;
          account_holder?: string;
          branch?: string | null;
          is_default?: boolean;
          for_payouts?: boolean;
          for_receipts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      stores: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          category: string;
          category_emoji: string | null;
          location: string;
          whatsapp: string;
          hours: string;
          open: boolean;
          image: string | null;
          accent: string | null;
          rating: number;
          reviews: number;
          is_demo: boolean;
          lat: number;
          lng: number;
          delivery_radius_km: number;
          delivery_fee: number;
          delivery_available: boolean;
          pickup_available: boolean;
          plan_id: "free" | "pro" | "business";
          restriction_active: boolean;
          restriction_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          category?: string;
          location?: string;
          whatsapp?: string;
          hours?: string;
          open?: boolean;
          image?: string | null;
          accent?: string | null;
          rating?: number;
          reviews?: number;
          is_demo?: boolean;
          lat?: number;
          lng?: number;
          delivery_radius_km?: number;
          delivery_fee?: number;
          delivery_available?: boolean;
          pickup_available?: boolean;
          plan_id?: "free" | "pro" | "business";
          restriction_active?: boolean;
          restriction_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          category?: string;
          category_emoji?: string | null;
          location?: string;
          whatsapp?: string;
          hours?: string;
          open?: boolean;
          image?: string | null;
          accent?: string | null;
          rating?: number;
          reviews?: number;
          is_demo?: boolean;
          lat?: number;
          lng?: number;
          delivery_radius_km?: number;
          delivery_fee?: number;
          delivery_available?: boolean;
          pickup_available?: boolean;
          plan_id?: "free" | "pro" | "business";
          restriction_active?: boolean;
          restriction_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          price: number;
          description: string | null;
          images: Json;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          price: number;
          description?: string | null;
          images?: Json;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          price?: number;
          description?: string | null;
          images?: Json;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string | null;
          store_id: string;
          status:
            | "new"
            | "paid"
            | "preparing"
            | "ready"
            | "driver_assigned"
            | "picked_up"
            | "on_the_way"
            | "delivered"
            | "completed"
            | "cancelled"
            | "disputed";
          delivery_type: "delivery" | "pickup";
          delivery_fee: number;
          subtotal: number;
          total: number;
          distance_km: number | null;
          items: Json;
          address: string | null;
          delivery_location: Json | null;
          delivery_details: Json | null;
          phone: string | null;
          notes: string | null;
          payment_method: "bank_transfer" | "cash";
          customer_payment_status: "pending" | "verified" | "rejected";
          payment_receipt_url: string | null;
          payment_verified_at: string | null;
          payment_verified_by: string | null;
          cash_collected_sar: number | null;
          cash_collected_at: string | null;
          cash_collected_by: string | null;
          cash_receipt_photo_url: string | null;
          subtotal_sar: number;
          commission_sar: number;
          delivery_fee_sar: number;
          plan_fee_deduction_sar: number;
          delivered_photo_url: string | null;
          delivered_at: string | null;
          completed_at: string | null;
          auto_confirm_at: string | null;
          dispute_status: "open" | "resolved" | "refunded" | null;
          dispute_reason: string | null;
          dispute_photo_url: string | null;
          dispute_resolved_at: string | null;
          dispute_resolution: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          refund_status: "pending" | "processing" | "completed" | "failed" | null;
          refund_amount_sar: number | null;
          refund_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          store_id: string;
          status?:
            | "new"
            | "paid"
            | "preparing"
            | "ready"
            | "driver_assigned"
            | "picked_up"
            | "on_the_way"
            | "delivered"
            | "completed"
            | "cancelled"
            | "disputed";
          delivery_type?: "delivery" | "pickup";
          delivery_fee?: number;
          subtotal?: number;
          total?: number;
          distance_km?: number | null;
          items?: Json;
          address?: string | null;
          delivery_location?: Json | null;
          delivery_details?: Json | null;
          phone?: string | null;
          notes?: string | null;
          payment_method?: "bank_transfer" | "cash";
          customer_payment_status?: "pending" | "verified" | "rejected";
          payment_receipt_url?: string | null;
          payment_verified_at?: string | null;
          payment_verified_by?: string | null;
          cash_collected_sar?: number | null;
          cash_collected_at?: string | null;
          cash_collected_by?: string | null;
          cash_receipt_photo_url?: string | null;
          subtotal_sar?: number;
          commission_sar?: number;
          delivery_fee_sar?: number;
          plan_fee_deduction_sar?: number;
          delivered_photo_url?: string | null;
          delivered_at?: string | null;
          completed_at?: string | null;
          auto_confirm_at?: string | null;
          dispute_status?: "open" | "resolved" | "refunded" | null;
          dispute_reason?: string | null;
          dispute_photo_url?: string | null;
          dispute_resolved_at?: string | null;
          dispute_resolution?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          refund_status?: "pending" | "processing" | "completed" | "failed" | null;
          refund_amount_sar?: number | null;
          refund_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          store_id?: string;
          status?:
            | "new"
            | "paid"
            | "preparing"
            | "ready"
            | "driver_assigned"
            | "picked_up"
            | "on_the_way"
            | "delivered"
            | "completed"
            | "cancelled"
            | "disputed";
          delivery_type?: "delivery" | "pickup";
          delivery_fee?: number;
          subtotal?: number;
          total?: number;
          distance_km?: number | null;
          items?: Json;
          address?: string | null;
          delivery_location?: Json | null;
          delivery_details?: Json | null;
          phone?: string | null;
          notes?: string | null;
          payment_method?: "bank_transfer" | "cash";
          customer_payment_status?: "pending" | "verified" | "rejected";
          payment_receipt_url?: string | null;
          payment_verified_at?: string | null;
          payment_verified_by?: string | null;
          cash_collected_sar?: number | null;
          cash_collected_at?: string | null;
          cash_collected_by?: string | null;
          cash_receipt_photo_url?: string | null;
          subtotal_sar?: number;
          commission_sar?: number;
          delivery_fee_sar?: number;
          plan_fee_deduction_sar?: number;
          delivered_photo_url?: string | null;
          delivered_at?: string | null;
          completed_at?: string | null;
          auto_confirm_at?: string | null;
          dispute_status?: "open" | "resolved" | "refunded" | null;
          dispute_reason?: string | null;
          dispute_photo_url?: string | null;
          dispute_resolved_at?: string | null;
          dispute_resolution?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          refund_status?: "pending" | "processing" | "completed" | "failed" | null;
          refund_amount_sar?: number | null;
          refund_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_plans: {
        Row: {
          id: "free" | "pro" | "business";
          name: string;
          price_usd: number;
          price_sar: number;
          max_products: number;
          max_photos_per_product: number;
          features: Json;
          badge: string | null;
          created_at: string;
        };
        Insert: {
          id: "free" | "pro" | "business";
          name: string;
          price_usd: number;
          price_sar: number;
          max_products: number;
          max_photos_per_product: number;
          features?: Json;
          badge?: string | null;
          created_at?: string;
        };
        Update: {
          id?: "free" | "pro" | "business";
          name?: string;
          price_usd?: number;
          price_sar?: number;
          max_products?: number;
          max_photos_per_product?: number;
          features?: Json;
          badge?: string | null;
          created_at?: string;
        };
      };
      subscription_charges: {
        Row: {
          id: string;
          store_id: string;
          plan_id: string;
          amount_sar: number;
          period_start: string;
          period_end: string;
          status: "unpaid" | "pending_verification" | "paid" | "overdue";
          receipt_url: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          plan_id: string;
          amount_sar: number;
          period_start: string;
          period_end: string;
          status?: "unpaid" | "pending_verification" | "paid" | "overdue";
          receipt_url?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          plan_id?: string;
          amount_sar?: number;
          period_start?: string;
          period_end?: string;
          status?: "unpaid" | "pending_verification" | "paid" | "overdue";
          receipt_url?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
      };
      billing_periods: {
        Row: {
          id: string;
          store_id: string;
          start_date: string;
          end_date: string;
          subscription_fee_usd: number;
          completed_orders: number;
          transaction_fee_usd: number;
          total_due_usd: number;
          status: "paid" | "pending_verification" | "unpaid" | "overdue";
          paid_at: string | null;
          payment_record_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          start_date: string;
          end_date: string;
          subscription_fee_usd?: number;
          completed_orders?: number;
          transaction_fee_usd?: number;
          total_due_usd?: number;
          status?: "paid" | "pending_verification" | "unpaid" | "overdue";
          paid_at?: string | null;
          payment_record_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          start_date?: string;
          end_date?: string;
          subscription_fee_usd?: number;
          completed_orders?: number;
          transaction_fee_usd?: number;
          total_due_usd?: number;
          status?: "paid" | "pending_verification" | "unpaid" | "overdue";
          paid_at?: string | null;
          payment_record_id?: string | null;
          created_at?: string;
        };
      };
      payment_records: {
        Row: {
          id: string;
          store_id: string;
          amount_usd: number;
          reference_number: string;
          notes: string | null;
          receipt_image: string | null;
          status: "paid" | "pending_verification" | "unpaid" | "overdue";
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
        };
        Insert: {
          id?: string;
          store_id: string;
          amount_usd: number;
          reference_number: string;
          notes?: string | null;
          receipt_image?: string | null;
          status?: "paid" | "pending_verification" | "unpaid" | "overdue";
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
        };
        Update: {
          id?: string;
          store_id?: string;
          amount_usd?: number;
          reference_number?: string;
          notes?: string | null;
          receipt_image?: string | null;
          status?: "paid" | "pending_verification" | "unpaid" | "overdue";
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_merchant_id: string;
          code_used: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_merchant_id: string;
          code_used?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referred_merchant_id?: string;
          code_used?: string | null;
          created_at?: string;
        };
      };
      commissions: {
        Row: {
          id: string;
          referral_id: string;
          amount_usd: number;
          amount_sar: number;
          source_type: string;
          status: "pending" | "approved" | "paid";
          paid_at: string | null;
          partner_payout_request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          referral_id: string;
          amount_usd: number;
          amount_sar: number;
          source_type?: string;
          status?: "pending" | "approved" | "paid";
          paid_at?: string | null;
          partner_payout_request_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          referral_id?: string;
          amount_usd?: number;
          amount_sar?: number;
          source_type?: string;
          status?: "pending" | "approved" | "paid";
          paid_at?: string | null;
          partner_payout_request_id?: string | null;
          created_at?: string;
        };
      };
      partner_payout_requests: {
        Row: {
          id: string;
          partner_id: string;
          amount_sar: number;
          status: "pending" | "approved" | "rejected" | "paid";
          payment_method: string | null;
          payment_details: import("./database.types").Json | null;
          notes: string | null;
          requested_at: string;
          processed_at: string | null;
          processed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          amount_sar: number;
          status?: "pending" | "approved" | "rejected" | "paid";
          payment_method?: string | null;
          payment_details?: import("./database.types").Json | null;
          notes?: string | null;
          requested_at?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_id?: string;
          amount_sar?: number;
          status?: "pending" | "approved" | "rejected" | "paid";
          payment_method?: string | null;
          payment_details?: import("./database.types").Json | null;
          notes?: string | null;
          requested_at?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      merchant_payout_requests: {
        Row: {
          id: string;
          merchant_id: string;
          store_id: string | null;
          amount_sar: number;
          status: "pending" | "approved" | "rejected" | "paid";
          payment_method: string;
          payment_details: import("./database.types").Json | null;
          notes: string | null;
          requested_at: string;
          processed_at: string | null;
          processed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          store_id?: string | null;
          amount_sar: number;
          status?: "pending" | "approved" | "rejected" | "paid";
          payment_method?: string;
          payment_details?: import("./database.types").Json | null;
          notes?: string | null;
          requested_at?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          store_id?: string | null;
          amount_sar?: number;
          status?: "pending" | "approved" | "rejected" | "paid";
          payment_method?: string;
          payment_details?: import("./database.types").Json | null;
          notes?: string | null;
          requested_at?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      driver_payout_requests: {
        Row: {
          id: string;
          driver_id: string;
          amount_sar: number;
          status: "pending" | "approved" | "rejected" | "paid";
          payment_method: string;
          payment_details: import("./database.types").Json | null;
          notes: string | null;
          requested_at: string;
          processed_at: string | null;
          processed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          amount_sar: number;
          status?: "pending" | "approved" | "rejected" | "paid";
          payment_method?: string;
          payment_details?: import("./database.types").Json | null;
          notes?: string | null;
          requested_at?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          amount_sar?: number;
          status?: "pending" | "approved" | "rejected" | "paid";
          payment_method?: string;
          payment_details?: import("./database.types").Json | null;
          notes?: string | null;
          requested_at?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      driver_cash_settlements: {
        Row: {
          id: string;
          driver_id: string;
          period_start: string;
          period_end: string;
          cash_collected_sar: number;
          driver_fee_sar: number;
          remitted_sar: number;
          status: "pending" | "settled";
          settled_at: string | null;
          settled_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          period_start: string;
          period_end: string;
          cash_collected_sar?: number;
          driver_fee_sar?: number;
          remitted_sar?: number;
          status?: "pending" | "settled";
          settled_at?: string | null;
          settled_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          period_start?: string;
          period_end?: string;
          cash_collected_sar?: number;
          driver_fee_sar?: number;
          remitted_sar?: number;
          status?: "pending" | "settled";
          settled_at?: string | null;
          settled_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payouts: {
        Row: {
          id: string;
          order_id: string;
          store_id: string;
          gross_sar: number;
          commission_sar: number;
          delivery_fee_sar: number;
          driver_fee_sar: number;
          plan_fee_deduction_sar: number;
          net_sar: number;
          status: "pending" | "released";
          released_at: string | null;
          released_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          store_id: string;
          gross_sar: number;
          commission_sar?: number;
          delivery_fee_sar?: number;
          driver_fee_sar?: number;
          plan_fee_deduction_sar?: number;
          net_sar: number;
          status?: "pending" | "released";
          released_at?: string | null;
          released_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          store_id?: string;
          gross_sar?: number;
          commission_sar?: number;
          delivery_fee_sar?: number;
          driver_fee_sar?: number;
          plan_fee_deduction_sar?: number;
          net_sar?: number;
          status?: "pending" | "released";
          released_at?: string | null;
          released_by?: string | null;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          order_id: string;
          store_id: string;
          customer_id: string;
          product_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          store_id: string;
          customer_id: string;
          product_id?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          store_id?: string;
          customer_id?: string;
          product_id?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      drivers: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          national_id: string;
          vehicle_type: string;
          vehicle_plate_number: string;
          photo_url: string | null;
          profile_photo_url: string | null;
          driver_photo_url: string | null;
          vehicle_photo_url: string | null;
          documents: Json;
          status: "pending_review" | "active" | "suspended" | "inactive";
          earnings_total: number;
          earnings_total_sar: number;
          deliveries_completed: number;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone: string;
          national_id: string;
          vehicle_type: string;
          vehicle_plate_number: string;
          photo_url?: string | null;
          profile_photo_url?: string | null;
          driver_photo_url?: string | null;
          vehicle_photo_url?: string | null;
          documents?: Json;
          status?: "pending_review" | "active" | "suspended" | "inactive";
          earnings_total?: number;
          earnings_total_sar?: number;
          deliveries_completed?: number;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string;
          national_id?: string;
          vehicle_type?: string;
          vehicle_plate_number?: string;
          photo_url?: string | null;
          profile_photo_url?: string | null;
          driver_photo_url?: string | null;
          vehicle_photo_url?: string | null;
          documents?: Json;
          status?: "pending_review" | "active" | "suspended" | "inactive";
          earnings_total?: number;
          earnings_total_sar?: number;
          deliveries_completed?: number;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      driver_payouts: {
        Row: {
          id: string;
          driver_id: string;
          delivery_id: string | null;
          amount_sar: number;
          status: "pending" | "released";
          released_at: string | null;
          released_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          delivery_id?: string | null;
          amount_sar: number;
          status?: "pending" | "released";
          released_at?: string | null;
          released_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          delivery_id?: string | null;
          amount_sar?: number;
          status?: "pending" | "released";
          released_at?: string | null;
          released_by?: string | null;
          created_at?: string;
        };
      };
      deliveries: {
        Row: {
          id: string;
          order_id: string;
          driver_id: string | null;
          store_id: string;
          status: "assigned" | "accepted" | "picked_up" | "on_the_way" | "delivered";
          fee: number;
          delivery_fee_sar: number;
          distance_km: number | null;
          pickup_location: Json;
          delivery_location: Json;
          delivery_details: Json | null;
          proof_photo_url: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          customer_address: string | null;
          notes: string | null;
          accepted_at: string | null;
          picked_up_at: string | null;
          on_the_way_at: string | null;
          delivered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          driver_id?: string | null;
          store_id: string;
          status?: "assigned" | "accepted" | "picked_up" | "on_the_way" | "delivered";
          fee?: number;
          delivery_fee_sar?: number;
          distance_km?: number | null;
          pickup_location?: Json;
          delivery_location?: Json;
          delivery_details?: Json | null;
          proof_photo_url?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_address?: string | null;
          notes?: string | null;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          on_the_way_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          driver_id?: string | null;
          store_id?: string;
          status?: "assigned" | "accepted" | "picked_up" | "on_the_way" | "delivered";
          fee?: number;
          delivery_fee_sar?: number;
          distance_km?: number | null;
          pickup_location?: Json;
          delivery_location?: Json;
          delivery_details?: Json | null;
          proof_photo_url?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_address?: string | null;
          notes?: string | null;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          on_the_way_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
        };
      };
      parcel_deliveries: {
        Row: {
          id: string;
          sender_id: string;
          driver_id: string | null;
          pickup_location: Json;
          dropoff_location: Json;
          pickup_details: Json | null;
          dropoff_details: Json | null;
          receiver_name: string;
          receiver_phone: string;
          item_description: string;
          item_category: string | null;
          weight_kg: number | null;
          fare_sar: number;
          driver_fee_sar: number;
          status: "pending" | "accepted" | "picked_up" | "on_the_way" | "delivered" | "cancelled";
          payment_status: "pending" | "verified" | "rejected";
          payment_method: "bank_transfer" | "cash";
          cash_payer: string | null;
          payment_receipt_url: string | null;
          pickup_photo_url: string | null;
          delivery_proof_url: string | null;
          notes: string | null;
          cash_collected_sar: number | null;
          cash_collected_at: string | null;
          cash_collected_by: string | null;
          cash_receipt_photo_url: string | null;
          accepted_at: string | null;
          picked_up_at: string | null;
          on_the_way_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
          distance_km: number | null;
          vehicle_type: string | null;
          length_cm: number | null;
          width_cm: number | null;
          height_cm: number | null;
          volumetric_weight_kg: number | null;
          fare_breakdown: Json | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          driver_id?: string | null;
          pickup_location?: import("./database.types").Json;
          dropoff_location?: import("./database.types").Json;
          pickup_details?: import("./database.types").Json | null;
          dropoff_details?: import("./database.types").Json | null;
          receiver_name?: string;
          receiver_phone?: string;
          item_description?: string;
          item_category?: string | null;
          weight_kg?: number | null;
          fare_sar?: number;
          driver_fee_sar?: number;
          status?: "pending" | "accepted" | "picked_up" | "on_the_way" | "delivered" | "cancelled";
          payment_status?: "pending" | "verified" | "rejected";
          payment_method?: "bank_transfer" | "cash";
          cash_payer?: string | null;
          payment_receipt_url?: string | null;
          pickup_photo_url?: string | null;
          delivery_proof_url?: string | null;
          notes?: string | null;
          cash_collected_sar?: number | null;
          cash_collected_at?: string | null;
          cash_collected_by?: string | null;
          cash_receipt_photo_url?: string | null;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          on_the_way_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
          distance_km?: number | null;
          vehicle_type?: string | null;
          length_cm?: number | null;
          width_cm?: number | null;
          height_cm?: number | null;
          volumetric_weight_kg?: number | null;
          fare_breakdown?: import("./database.types").Json | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          driver_id?: string | null;
          pickup_location?: import("./database.types").Json;
          dropoff_location?: import("./database.types").Json;
          pickup_details?: import("./database.types").Json | null;
          dropoff_details?: import("./database.types").Json | null;
          receiver_name?: string;
          receiver_phone?: string;
          item_description?: string;
          item_category?: string | null;
          weight_kg?: number | null;
          fare_sar?: number;
          driver_fee_sar?: number;
          status?: "pending" | "accepted" | "picked_up" | "on_the_way" | "delivered" | "cancelled";
          payment_status?: "pending" | "verified" | "rejected";
          payment_method?: "bank_transfer" | "cash";
          cash_payer?: string | null;
          payment_receipt_url?: string | null;
          pickup_photo_url?: string | null;
          delivery_proof_url?: string | null;
          notes?: string | null;
          cash_collected_sar?: number | null;
          cash_collected_at?: string | null;
          cash_collected_by?: string | null;
          cash_receipt_photo_url?: string | null;
          accepted_at?: string | null;
          picked_up_at?: string | null;
          on_the_way_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
          distance_km?: number | null;
          vehicle_type?: string | null;
          length_cm?: number | null;
          width_cm?: number | null;
          height_cm?: number | null;
          volumetric_weight_kg?: number | null;
          fare_breakdown?: import("./database.types").Json | null;
        };
      };
      messages: {
        Row: {
          id: string;
          store_id: string;
          customer_id: string;
          sender_id: string;
          sender_role: "customer" | "merchant";
          content: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          customer_id: string;
          sender_id: string;
          sender_role: "customer" | "merchant";
          content: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          customer_id?: string;
          sender_id?: string;
          sender_role?: "customer" | "merchant";
          content?: string;
          read_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      merchant_available_balance: {
        Args: { p_merchant_id: string };
        Returns: number;
      };
      driver_available_balance: {
        Args: { p_driver_id: string };
        Returns: number;
      };
      driver_unsettled_cod_balance: {
        Args: { p_driver_id: string };
        Returns: number;
      };
      driver_cod_collected_sar: {
        Args: { p_driver_id: string };
        Returns: number;
      };
      driver_cod_fee_sar: {
        Args: { p_driver_id: string };
        Returns: number;
      };
      request_merchant_payout: {
        Args: {
          p_merchant_id: string;
          p_amount_sar: number;
          p_payment_method?: string;
          p_payment_details?: import("./database.types").Json;
          p_store_id?: string;
        };
        Returns: string;
      };
      request_driver_payout: {
        Args: {
          p_driver_id: string;
          p_amount_sar: number;
          p_payment_method?: string;
          p_payment_details?: import("./database.types").Json;
        };
        Returns: string;
      };
      process_merchant_payout: {
        Args: {
          p_request_id: string;
          p_status: string;
          p_processed_by: string;
          p_notes?: string;
        };
        Returns: undefined;
      };
      process_driver_payout: {
        Args: {
          p_request_id: string;
          p_status: string;
          p_processed_by: string;
          p_notes?: string;
        };
        Returns: undefined;
      };
      partner_available_balance: {
        Args: { p_partner_id: string };
        Returns: number;
      };
      request_partner_payout: {
        Args: {
          p_partner_id: string;
          p_amount_sar: number;
          p_payment_method?: string;
          p_payment_details?: import("./database.types").Json;
        };
        Returns: string;
      };
      process_partner_payout: {
        Args: {
          p_request_id: string;
          p_status: string;
          p_processed_by: string;
          p_notes?: string;
        };
        Returns: undefined;
      };
    };
    Enums: {};
  };
}

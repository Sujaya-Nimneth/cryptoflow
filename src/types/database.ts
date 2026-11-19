export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      portfolio_holdings: {
        Row: {
          id: string;
          user_id: string;
          crypto_id: string;
          quantity: number;
          purchase_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          crypto_id: string;
          quantity: number;
          purchase_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          crypto_id?: string;
          quantity?: number;
          purchase_price?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      watchlist_entries: {
        Row: {
          id: string;
          user_id: string;
          crypto_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          crypto_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          crypto_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      price_alerts: {
        Row: {
          id: string;
          user_id: string;
          crypto_id: string;
          direction: 'above' | 'below';
          target_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          crypto_id: string;
          direction: 'above' | 'below';
          target_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          crypto_id?: string;
          direction?: 'above' | 'below';
          target_price?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

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
      profiles: {
        Row: {
          id: string;
          display_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      counties: {
        Row: {
          id: string;
          name: string;
          slug: string;
          center_lat: number;
          center_lng: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          center_lat: number;
          center_lng: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          center_lat?: number;
          center_lng?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      county_admins: {
        Row: {
          id: string;
          user_id: string;
          county_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          county_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          county_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "county_admins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "county_admins_county_id_fkey";
            columns: ["county_id"];
            isOneToOne: false;
            referencedRelation: "counties";
            referencedColumns: ["id"];
          }
        ];
      };
      forum_windows: {
        Row: {
          id: string;
          county_id: string;
          hijri_month: string;
          hijri_year: number;
          opened_at: string;
          closed_at: string | null;
          decision: "sighted" | "not_sighted" | null;
          decided_at: string | null;
          opened_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          county_id: string;
          hijri_month: string;
          hijri_year: number;
          opened_at?: string;
          closed_at?: string | null;
          decision?: "sighted" | "not_sighted" | null;
          decided_at?: string | null;
          opened_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          county_id?: string;
          hijri_month?: string;
          hijri_year?: number;
          opened_at?: string;
          closed_at?: string | null;
          decision?: "sighted" | "not_sighted" | null;
          decided_at?: string | null;
          opened_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_windows_county_id_fkey";
            columns: ["county_id"];
            isOneToOne: false;
            referencedRelation: "counties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_windows_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      posts: {
        Row: {
          id: string;
          forum_window_id: string;
          author_id: string;
          parent_id: string | null;
          body: string;
          image_url: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          forum_window_id: string;
          author_id: string;
          parent_id?: string | null;
          body: string;
          image_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          forum_window_id?: string;
          author_id?: string;
          parent_id?: string | null;
          body?: string;
          image_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_forum_window_id_fkey";
            columns: ["forum_window_id"];
            isOneToOne: false;
            referencedRelation: "forum_windows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

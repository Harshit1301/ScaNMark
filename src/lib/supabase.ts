import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client if environment variables are not set
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here') {
    console.warn('Supabase environment variables not configured. Using mock client.');
    
    // Return a mock client that doesn't make real API calls
    return {
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
            order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
            in: (column: string, values: any[]) => Promise.resolve({ data: [], error: null })
          }),
          order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
          filter: (column: string, operator: string, value: any) => Promise.resolve({ data: [], error: null })
        }),
        insert: (data: any) => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
          })
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
        }),
        delete: () => ({
          eq: (column: string, value: any) => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
        })
      })
    } as any;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'professor';
          department: string;
          profile_image: string | null;
          password: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'admin' | 'professor';
          department: string;
          profile_image?: string | null;
          password?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'professor';
          department?: string;
          profile_image?: string | null;
          password?: string | null;
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          name: string;
          roll_number: string;
          email: string;
          department: string;
          profile_image: string | null;
          face_encoding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          roll_number: string;
          email: string;
          department: string;
          profile_image?: string | null;
          face_encoding?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          roll_number?: string;
          email?: string;
          department?: string;
          profile_image?: string | null;
          face_encoding?: number[] | null;
          created_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string;
          department: string;
          professor_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          department: string;
          professor_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          department?: string;
          professor_id?: string;
          created_at?: string;
        };
      };
      subject_enrollments: {
        Row: {
          id: string;
          subject_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          student_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          student_id?: string;
          created_at?: string;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          subject_id: string;
          date: string;
          marked_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          date: string;
          marked_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          date?: string;
          marked_by?: string;
          created_at?: string;
        };
      };
      attendance_entries: {
        Row: {
          id: string;
          attendance_record_id: string;
          student_id: string;
          status: 'present' | 'absent';
          created_at: string;
        };
        Insert: {
          id?: string;
          attendance_record_id: string;
          student_id: string;
          status: 'present' | 'absent';
          created_at?: string;
        };
        Update: {
          id?: string;
          attendance_record_id?: string;
          student_id?: string;
          status?: 'present' | 'absent';
          created_at?: string;
        };
      };
    };
  };
};
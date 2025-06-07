import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here') {
    console.error('❌ Supabase environment variables not configured properly!');
    console.log('Please check your .env file and ensure you have:');
    console.log('VITE_SUPABASE_URL=your_supabase_project_url');
    console.log('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
    
    // Return a mock client that logs errors
    return {
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            maybeSingle: () => {
              console.error(`❌ Attempted to query ${table} table but Supabase is not configured`);
              return Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
            },
            single: () => {
              console.error(`❌ Attempted to query ${table} table but Supabase is not configured`);
              return Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
            },
            order: (column: string, options?: any) => {
              console.error(`❌ Attempted to query ${table} table but Supabase is not configured`);
              return Promise.resolve({ data: [], error: { message: 'Supabase not configured' } });
            },
            in: (column: string, values: any[]) => {
              console.error(`❌ Attempted to query ${table} table but Supabase is not configured`);
              return Promise.resolve({ data: [], error: { message: 'Supabase not configured' } });
            }
          }),
          order: (column: string, options?: any) => {
            console.error(`❌ Attempted to query ${table} table but Supabase is not configured`);
            return Promise.resolve({ data: [], error: { message: 'Supabase not configured' } });
          },
          filter: (column: string, operator: string, value: any) => {
            console.error(`❌ Attempted to query ${table} table but Supabase is not configured`);
            return Promise.resolve({ data: [], error: { message: 'Supabase not configured' } });
          }
        }),
        insert: (data: any) => ({
          select: () => ({
            single: () => {
              console.error(`❌ Attempted to insert into ${table} table but Supabase is not configured`);
              return Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
            }
          })
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => {
            console.error(`❌ Attempted to update ${table} table but Supabase is not configured`);
            return Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
          }
        }),
        delete: () => ({
          eq: (column: string, value: any) => {
            console.error(`❌ Attempted to delete from ${table} table but Supabase is not configured`);
            return Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
          }
        })
      })
    } as any;
  }

  console.log('✅ Supabase client initialized successfully');
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

// Test database connection
export const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

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
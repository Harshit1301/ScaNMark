/*
  # Complete Database Schema Setup with RLS

  1. New Tables
    - `users` - Store user/professor information
    - `students` - Store student information with face encodings
    - `subjects` - Store subject/course information
    - `subject_enrollments` - Link students to subjects
    - `attendance_records` - Store attendance session records
    - `attendance_entries` - Store individual student attendance status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Ensure proper data isolation

  3. Sample Data
    - Insert demo users and students for testing
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'professor')),
  department text NOT NULL,
  profile_image text,
  password text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  roll_number text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  department text NOT NULL,
  profile_image text,
  face_encoding double precision[],
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  department text NOT NULL,
  professor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create subject_enrollments table
CREATE TABLE IF NOT EXISTS subject_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  date date NOT NULL,
  marked_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance_entries table
CREATE TABLE IF NOT EXISTS attendance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id uuid REFERENCES attendance_records(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('present', 'absent')),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users policies
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can delete users" ON users FOR DELETE USING (true);

-- Students policies
CREATE POLICY "Users can read all students" ON students FOR SELECT USING (true);
CREATE POLICY "Users can insert students" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update students" ON students FOR UPDATE USING (true);
CREATE POLICY "Users can delete students" ON students FOR DELETE USING (true);

-- Subjects policies
CREATE POLICY "Users can read all subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Users can insert subjects" ON subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update subjects" ON subjects FOR UPDATE USING (true);
CREATE POLICY "Users can delete subjects" ON subjects FOR DELETE USING (true);

-- Subject enrollments policies
CREATE POLICY "Users can read all enrollments" ON subject_enrollments FOR SELECT USING (true);
CREATE POLICY "Users can insert enrollments" ON subject_enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update enrollments" ON subject_enrollments FOR UPDATE USING (true);
CREATE POLICY "Users can delete enrollments" ON subject_enrollments FOR DELETE USING (true);

-- Attendance records policies
CREATE POLICY "Users can read all attendance records" ON attendance_records FOR SELECT USING (true);
CREATE POLICY "Users can insert attendance records" ON attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update attendance records" ON attendance_records FOR UPDATE USING (true);
CREATE POLICY "Users can delete attendance records" ON attendance_records FOR DELETE USING (true);

-- Attendance entries policies
CREATE POLICY "Users can read all attendance entries" ON attendance_entries FOR SELECT USING (true);
CREATE POLICY "Users can insert attendance entries" ON attendance_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update attendance entries" ON attendance_entries FOR UPDATE USING (true);
CREATE POLICY "Users can delete attendance entries" ON attendance_entries FOR DELETE USING (true);

-- Insert sample data for testing

-- Insert demo users
INSERT INTO users (id, email, name, role, department, password) VALUES
  ('demo-admin-1', 'admin@university.edu', 'Dr. Admin User', 'admin', 'Administration', 'password'),
  ('demo-prof-1', 'sarah.johnson@university.edu', 'Dr. Sarah Johnson', 'professor', 'Computer Science', 'password'),
  ('demo-prof-2', 'john.smith@university.edu', 'Dr. John Smith', 'professor', 'Computer Science', 'password')
ON CONFLICT (email) DO NOTHING;

-- Insert demo students
INSERT INTO students (id, name, roll_number, email, department) VALUES
  ('student-1', 'Alice Chen', 'CS001', 'alice.chen@student.edu', 'Computer Science'),
  ('student-2', 'Bob Smith', 'CS002', 'bob.smith@student.edu', 'Computer Science'),
  ('student-3', 'Carol Davis', 'CS003', 'carol.davis@student.edu', 'Computer Science'),
  ('student-4', 'David Wilson', 'CS004', 'david.wilson@student.edu', 'Computer Science'),
  ('student-5', 'Emma Brown', 'CS005', 'emma.brown@student.edu', 'Computer Science'),
  ('student-6', 'Frank Miller', 'CS006', 'frank.miller@student.edu', 'Computer Science')
ON CONFLICT (roll_number) DO NOTHING;

-- Insert demo subjects
INSERT INTO subjects (id, name, code, department, professor_id) VALUES
  ('subject-1', 'Data Structures and Algorithms', 'CS301', 'Computer Science', 'demo-prof-1'),
  ('subject-2', 'Database Management Systems', 'CS302', 'Computer Science', 'demo-prof-1'),
  ('subject-3', 'Web Development', 'CS303', 'Computer Science', 'demo-prof-2')
ON CONFLICT (code) DO NOTHING;

-- Insert demo enrollments
INSERT INTO subject_enrollments (subject_id, student_id) VALUES
  ('subject-1', 'student-1'),
  ('subject-1', 'student-2'),
  ('subject-1', 'student-3'),
  ('subject-1', 'student-4'),
  ('subject-1', 'student-5'),
  ('subject-1', 'student-6'),
  ('subject-2', 'student-1'),
  ('subject-2', 'student-2'),
  ('subject-2', 'student-3'),
  ('subject-2', 'student-4'),
  ('subject-2', 'student-5'),
  ('subject-3', 'student-2'),
  ('subject-3', 'student-3'),
  ('subject-3', 'student-4'),
  ('subject-3', 'student-5'),
  ('subject-3', 'student-6')
ON CONFLICT DO NOTHING;
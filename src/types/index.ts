export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'professor';
  department: string;
  profile_image?: string;
  password?: string;
  created_at?: string;
}

export interface Student {
  id: string;
  name: string;
  roll_number: string;
  email: string;
  department: string;
  profile_image?: string;
  face_encoding?: number[];
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  professor_id: string;
  created_at?: string;
  professor?: User;
  subject_enrollments?: { student: Student }[];
}

export interface AttendanceRecord {
  id: string;
  subject_id: string;
  date: string;
  marked_by: string;
  created_at?: string;
  subject?: Subject;
  attendance_entries?: AttendanceEntry[];
}

export interface AttendanceEntry {
  id: string;
  attendance_record_id: string;
  student_id: string;
  status: 'present' | 'absent';
  created_at?: string;
  student?: Student;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface SubjectEnrollment {
  id: string;
  subject_id: string;
  student_id: string;
  created_at?: string;
}
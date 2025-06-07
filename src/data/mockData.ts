import { User, Subject, Student, AttendanceRecord } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Dr. Sarah Johnson',
  email: 'sarah.johnson@university.edu',
  department: 'Computer Science',
  profileImage: 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
};

export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Alice Chen',
    rollNumber: 'CS001',
    email: 'alice.chen@student.edu',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '2',
    name: 'Bob Smith',
    rollNumber: 'CS002',
    email: 'bob.smith@student.edu',
    profileImage: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '3',
    name: 'Carol Davis',
    rollNumber: 'CS003',
    email: 'carol.davis@student.edu',
    profileImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '4',
    name: 'David Wilson',
    rollNumber: 'CS004',
    email: 'david.wilson@student.edu',
    profileImage: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '5',
    name: 'Emma Brown',
    rollNumber: 'CS005',
    email: 'emma.brown@student.edu',
    profileImage: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  },
  {
    id: '6',
    name: 'Frank Miller',
    rollNumber: 'CS006',
    email: 'frank.miller@student.edu',
    profileImage: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
  }
];

export const mockSubjects: Subject[] = [
  {
    id: '1',
    name: 'Data Structures and Algorithms',
    code: 'CS301',
    department: 'Computer Science',
    enrolledStudents: mockStudents
  },
  {
    id: '2',
    name: 'Database Management Systems',
    code: 'CS302',
    department: 'Computer Science',
    enrolledStudents: mockStudents.slice(0, 5)
  },
  {
    id: '3',
    name: 'Web Development',
    code: 'CS303',
    department: 'Computer Science',
    enrolledStudents: mockStudents.slice(1, 6)
  }
];

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    subjectId: '1',
    subjectName: 'Data Structures and Algorithms',
    date: '2024-01-15',
    totalStudents: 6,
    presentStudents: mockStudents.slice(0, 4),
    absentStudents: mockStudents.slice(4, 6),
    markedBy: 'Dr. Sarah Johnson'
  },
  {
    id: '2',
    subjectId: '2',
    subjectName: 'Database Management Systems',
    date: '2024-01-14',
    totalStudents: 5,
    presentStudents: mockStudents.slice(0, 3),
    absentStudents: mockStudents.slice(3, 5),
    markedBy: 'Dr. Sarah Johnson'
  },
  {
    id: '3',
    subjectId: '1',
    subjectName: 'Data Structures and Algorithms',
    date: '2024-01-13',
    totalStudents: 6,
    presentStudents: mockStudents.slice(0, 5),
    absentStudents: mockStudents.slice(5, 6),
    markedBy: 'Dr. Sarah Johnson'
  }
];
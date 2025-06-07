import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Calendar, 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  Plus,
  Clock,
  TrendingUp,
  Shield,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, testDatabaseConnection } from '../lib/supabase';
import MarkAttendance from './MarkAttendance';
import ViewAttendance from './ViewAttendance';
import Profile from './Profile';
import AdminPanel from './AdminPanel';
import { Subject, AttendanceRecord } from '../types';

type DashboardView = 'overview' | 'mark-attendance' | 'view-attendance' | 'profile' | 'admin';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [databaseConnected, setDatabaseConnected] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalStudents: 0,
    totalSessions: 0,
    averageAttendance: 0
  });

  useEffect(() => {
    checkDatabaseConnection();
    loadDashboardData();
  }, [user]);

  const checkDatabaseConnection = async () => {
    const isConnected = await testDatabaseConnection();
    setDatabaseConnected(isConnected);
  };

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Load subjects
      let subjectsQuery = supabase.from('subjects').select(`
        *,
        professor:users(name),
        subject_enrollments(
          student:students(*)
        )
      `);

      if (user.role === 'professor') {
        subjectsQuery = subjectsQuery.eq('professor_id', user.id);
      }

      const { data: subjectsData, error: subjectsError } = await subjectsQuery;
      if (!subjectsError && subjectsData) {
        setSubjects(subjectsData);
      } else if (subjectsError) {
        console.error('Error loading subjects:', subjectsError);
      }

      // Load attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          *,
          subject:subjects(name),
          attendance_entries(
            student:students(*),
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (!attendanceError && attendanceData) {
        setAttendanceRecords(attendanceData);
      } else if (attendanceError) {
        console.error('Error loading attendance records:', attendanceError);
      }

      // Calculate stats
      const totalSubjects = subjectsData?.length || 0;
      const totalStudents = subjectsData?.reduce((total, subject) => 
        total + (subject.subject_enrollments?.length || 0), 0) || 0;
      const totalSessions = attendanceData?.length || 0;
      
      let averageAttendance = 0;
      if (attendanceData && attendanceData.length > 0) {
        const attendanceRates = attendanceData.map(record => {
          const presentCount = record.attendance_entries?.filter(entry => entry.status === 'present').length || 0;
          const totalCount = record.attendance_entries?.length || 1;
          return presentCount / totalCount;
        });
        averageAttendance = Math.round(
          attendanceRates.reduce((sum, rate) => sum + rate, 0) / attendanceRates.length * 100
        );
      }

      setStats({
        totalSubjects,
        totalStudents,
        totalSessions,
        averageAttendance
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'mark-attendance', label: 'Mark Attendance', icon: Camera },
    { id: 'view-attendance', label: 'View Attendance', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel', icon: Shield }] : []),
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'mark-attendance':
        return <MarkAttendance onAttendanceMarked={loadDashboardData} />;
      case 'view-attendance':
        return <ViewAttendance />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return user?.role === 'admin' ? <AdminPanel /> : null;
      default:
        return (
          <div className="space-y-6">
            {/* Database Connection Status */}
            {databaseConnected === false && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Database Connection Issue</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Unable to connect to Supabase. Please check your environment variables and database setup.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
                <p className="text-gray-600 mt-1">Here's what's happening with your classes today.</p>
              </div>
              {user?.role !== 'admin' && (
                <button
                  onClick={() => setCurrentView('mark-attendance')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Mark Attendance</span>
                </button>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Subjects</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSubjects}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Attendance Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Avg. Attendance</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageAttendance}%</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h3>
                <div className="space-y-4">
                  {attendanceRecords.slice(0, 3).map((record) => {
                    const presentCount = record.attendance_entries?.filter(entry => entry.status === 'present').length || 0;
                    const totalCount = record.attendance_entries?.length || 0;
                    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
                    
                    return (
                      <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{record.subject?.name}</p>
                          <p className="text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {presentCount}/{totalCount}
                          </p>
                          <p className="text-xs text-gray-600">
                            {percentage}% present
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {attendanceRecords.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No attendance records yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Subjects</h3>
                <div className="space-y-4">
                  {subjects.slice(0, 3).map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{subject.name}</p>
                        <p className="text-sm text-gray-600">{subject.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {subject.subject_enrollments?.length || 0} students
                        </p>
                        {user?.role !== 'admin' && (
                          <button
                            onClick={() => setCurrentView('mark-attendance')}
                            className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            Mark attendance
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {subjects.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No subjects assigned yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Smart Attendance</h2>
                <p className="text-sm text-gray-600">
                  {user?.role === 'admin' ? 'Admin Panel' : 'Professor Panel'}
                </p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as DashboardView)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={user?.profile_image || 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600">{user?.department}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
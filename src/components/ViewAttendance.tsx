import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Download, Eye, Users, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AttendanceRecord, Subject, Student } from '../types';

const ViewAttendance: React.FC = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadSubjects(), loadAttendanceRecords()]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const loadSubjects = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('subjects')
        .select('*');

      if (user.role === 'professor') {
        query = query.eq('professor_id', user.id);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadAttendanceRecords = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          subject:subjects(name, code),
          attendance_entries(
            *,
            student:students(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (user.role === 'professor') {
        // Filter by professor's subjects
        const { data: professorSubjects } = await supabase
          .from('subjects')
          .select('id')
          .eq('professor_id', user.id);

        if (professorSubjects) {
          const subjectIds = professorSubjects.map(s => s.id);
          query = query.in('subject_id', subjectIds);
        }
      }

      const { data, error } = await query;
      
      if (!error && data) {
        setAttendanceRecords(data);
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSubject = selectedSubject === 'all' || record.subject_id === selectedSubject;
    const matchesDate = !selectedDate || record.date === selectedDate;
    const matchesSearch = !searchTerm || 
      record.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subject?.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSubject && matchesDate && matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Subject', 'Total Students', 'Present', 'Absent', 'Attendance %'];
    const data = filteredRecords.map(record => {
      const presentCount = record.attendance_entries?.filter(entry => entry.status === 'present').length || 0;
      const totalCount = record.attendance_entries?.length || 0;
      const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
      
      return [
        record.date,
        record.subject?.name || '',
        totalCount,
        presentCount,
        totalCount - presentCount,
        percentage + '%'
      ];
    });
    
    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (selectedRecord) {
    const presentStudents = selectedRecord.attendance_entries?.filter(entry => entry.status === 'present') || [];
    const absentStudents = selectedRecord.attendance_entries?.filter(entry => entry.status === 'absent') || [];
    const totalStudents = selectedRecord.attendance_entries?.length || 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedRecord(null)}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-2 transition-colors"
          >
            <span>← Back to Records</span>
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Record</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedRecord.subject?.name}</h1>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(selectedRecord.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{totalStudents} total students</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Marked on {new Date(selectedRecord.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Present</p>
                  <p className="text-2xl font-bold text-green-900">{presentStudents.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Absent</p>
                  <p className="text-2xl font-bold text-red-900">{absentStudents.length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Attendance Rate</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {totalStudents > 0 ? Math.round((presentStudents.length / totalStudents) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-green-700">
                Present Students ({presentStudents.length})
              </h3>
              <div className="space-y-3">
                {presentStudents.map((entry) => (
                  <div key={entry.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <img
                      src={entry.student?.profile_image || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop'}
                      alt={entry.student?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{entry.student?.name}</p>
                      <p className="text-sm text-gray-600">{entry.student?.roll_number}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-700">
                Absent Students ({absentStudents.length})
              </h3>
              <div className="space-y-3">
                {absentStudents.map((entry) => (
                  <div key={entry.id} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <img
                      src={entry.student?.profile_image || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop'}
                      alt={entry.student?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{entry.student?.name}</p>
                      <p className="text-sm text-gray-600">{entry.student?.roll_number}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
          <p className="text-gray-600 mt-1">View and manage past attendance records</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Download className="w-5 h-5" />
          <span>Export Data</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subjects..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedSubject('all');
                setSelectedDate('');
                setSearchTerm('');
              }}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredRecords.length} Record{filteredRecords.length !== 1 ? 's' : ''} Found
            </h2>
            <p className="text-gray-600">
              Average attendance: {
                filteredRecords.length > 0
                  ? Math.round(
                      filteredRecords.reduce((sum, record) => {
                        const presentCount = record.attendance_entries?.filter(entry => entry.status === 'present').length || 0;
                        const totalCount = record.attendance_entries?.length || 1;
                        return sum + (presentCount / totalCount);
                      }, 0) / filteredRecords.length * 100
                    )
                  : 0
              }%
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Classes</p>
            <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Subject</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Total</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Present</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Absent</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Attendance</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => {
                  const presentCount = record.attendance_entries?.filter(entry => entry.status === 'present').length || 0;
                  const totalCount = record.attendance_entries?.length || 0;
                  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.subject?.name}</p>
                          <p className="text-xs text-gray-600">{record.subject?.code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{totalCount}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {presentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {totalCount - presentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                attendancePercentage >= 80
                                  ? 'bg-green-500'
                                  : attendancePercentage >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${attendancePercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{attendancePercentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {!isLoading && filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-600">Try adjusting your filters or mark some attendance first.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAttendance;
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  Camera,
  Upload,
  UserCheck,
  BookOpen,
  Shield,
  Key,
  Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User, Student, Subject } from '../types';
import { getFaceDescriptor, loadFaceRecognitionModels } from '../lib/faceRecognition';

type AdminView = 'users' | 'students' | 'subjects';

const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ id: '', password: '' });
  const [currentView, setCurrentView] = useState<AdminView>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [authError, setAuthError] = useState('');

  // Admin authentication constants
  const ADMIN_ID = 'ADMIN2024';
  const ADMIN_PASSWORD = 'SecureAdmin@123';

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      loadFaceRecognitionModels();
    }
  }, [currentView, isAuthenticated]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (adminCredentials.id === ADMIN_ID && adminCredentials.password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
    } else {
      setAuthError('Invalid admin credentials. Please check your ID and password.');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
    setAdminCredentials({ id: '', password: '' });
  };

  // Check if admin is already authenticated on component mount
  useEffect(() => {
    const isAdminAuth = localStorage.getItem('adminAuthenticated');
    if (isAdminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      switch (currentView) {
        case 'users':
          await loadUsers();
          break;
        case 'students':
          await loadStudents();
          break;
        case 'subjects':
          await loadSubjects();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setUsers(data);
    }
  };

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setStudents(data);
    }
  };

  const loadSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        professor:users(name)
      `)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSubjects(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      let table = '';
      switch (currentView) {
        case 'users':
          table = 'users';
          break;
        case 'students':
          table = 'students';
          break;
        case 'subjects':
          table = 'subjects';
          break;
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (!error) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleSave = async (formData: any) => {
    try {
      let table = '';
      let data = { ...formData };
      
      // Generate password for new professors
      if (currentView === 'users' && !editingItem && data.role === 'professor') {
        const generatedPassword = generatePassword();
        data.password = generatedPassword;
        
        // Show the generated credentials to admin
        alert(`Professor account created successfully!\n\nLogin Credentials:\nEmail: ${data.email}\nPassword: ${generatedPassword}\n\nPlease share these credentials with the professor securely.`);
      }
      
      switch (currentView) {
        case 'users':
          table = 'users';
          break;
        case 'students':
          table = 'students';
          break;
        case 'subjects':
          table = 'subjects';
          break;
      }

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from(table)
          .update(data)
          .eq('id', editingItem.id);
        
        if (!error) {
          setEditingItem(null);
          loadData();
        }
      } else {
        // Create new item
        const { error } = await supabase
          .from(table)
          .insert([data]);
        
        if (!error) {
          setShowAddModal(false);
          loadData();
        }
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleImageUpload = async (file: File, studentId?: string): Promise<string | null> => {
    try {
      // Create image element for face detection
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      return new Promise((resolve) => {
        img.onload = async () => {
          try {
            // Get face descriptor
            const descriptor = await getFaceDescriptor(img);
            
            if (descriptor && studentId) {
              // Save face encoding to student record
              await supabase
                .from('students')
                .update({ face_encoding: Array.from(descriptor) })
                .eq('id', studentId);
            }
            
            URL.revokeObjectURL(imageUrl);
            resolve(imageUrl);
          } catch (error) {
            console.error('Error processing face:', error);
            resolve(imageUrl);
          }
        };
        img.src = imageUrl;
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const filteredData = () => {
    let data: any[] = [];
    switch (currentView) {
      case 'users':
        data = users;
        break;
      case 'students':
        data = students;
        break;
      case 'subjects':
        data = subjects;
        break;
    }

    return data.filter(item => 
      Object.values(item).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  // Admin login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
              <p className="text-red-100">Secure Administrative Panel</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div>
                  <label htmlFor="adminId" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin ID
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="adminId"
                      type="text"
                      value={adminCredentials.id}
                      onChange={(e) => setAdminCredentials({ ...adminCredentials, id: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter admin ID"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="adminPassword"
                      type="password"
                      value={adminCredentials.password}
                      onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter admin password"
                      required
                    />
                  </div>
                </div>
                
                {authError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {authError}
                  </div>
                )}
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Access Admin Panel
                </button>
              </form>
              
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  <strong>Demo Credentials:</strong><br />
                  ID: ADMIN2024<br />
                  Password: SecureAdmin@123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderTable = () => {
    const data = filteredData();

    if (currentView === 'users') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Email</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Department</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Login Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.profile_image || 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop'}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{user.department}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Key className="w-3 h-3 mr-1" />
                      Credentials Set
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingItem(user)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (currentView === 'students') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Student</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Roll Number</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Email</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Department</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Face Data</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((student: Student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={student.profile_image || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop'}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="font-medium text-gray-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{student.roll_number}</td>
                  <td className="px-6 py-4 text-gray-900">{student.email}</td>
                  <td className="px-6 py-4 text-gray-900">{student.department}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.face_encoding ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {student.face_encoding ? 'Enrolled' : 'Not Enrolled'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingItem(student)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (currentView === 'subjects') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Subject</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Code</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Department</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Professor</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((subject: Subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{subject.name}</td>
                  <td className="px-6 py-4 text-gray-900">{subject.code}</td>
                  <td className="px-6 py-4 text-gray-900">{subject.department}</td>
                  <td className="px-6 py-4 text-gray-900">{subject.professor?.name || 'Not Assigned'}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingItem(subject)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  const menuItems = [
    { id: 'users', label: 'Users & Professors', icon: Users },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage users, students, and subjects</p>
        </div>
        <button
          onClick={handleAdminLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <Shield className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as AdminView)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add {currentView.slice(0, -1)}</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          renderTable()
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <AddEditModal
          type={currentView}
          item={editingItem}
          onSave={handleSave}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onImageUpload={handleImageUpload}
          users={users}
        />
      )}
    </div>
  );
};

interface AddEditModalProps {
  type: AdminView;
  item?: any;
  onSave: (data: any) => void;
  onClose: () => void;
  onImageUpload: (file: File, studentId?: string) => Promise<string | null>;
  users: User[];
}

const AddEditModal: React.FC<AddEditModalProps> = ({ type, item, onSave, onClose, onImageUpload, users }) => {
  const [formData, setFormData] = useState<any>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (item) {
      setFormData(item);
      setImagePreview(item.profile_image || '');
    } else {
      setFormData({});
      setImagePreview('');
    }
  }, [item]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalData = { ...formData };
    
    if (imageFile) {
      const imageUrl = await onImageUpload(imageFile, item?.id);
      if (imageUrl) {
        finalData.profile_image = imageUrl;
      }
    }
    
    try {
  await onSave(finalData);
  onClose(); // Close modal on success
} catch (error) {
  console.error('Save failed:', error);
  // Show error notification to user
}

  };

  const renderForm = () => {
    if (type === 'users') {
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={formData.role || 'professor'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="professor">Professor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          {!item && formData.role === 'professor' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800 mb-2">
                <Key className="w-5 h-5" />
                <span className="font-medium">Login Credentials</span>
              </div>
              <p className="text-sm text-blue-700">
                A secure password will be automatically generated for this professor. 
                The credentials will be displayed after creation for you to share securely.
              </p>
            </div>
          )}
        </>
      );
    }

    if (type === 'students') {
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
              <input
                type="text"
                value={formData.roll_number || ''}
                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo (for face recognition)
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload a clear photo for facial recognition enrollment
            </p>
          </div>
        </>
      );
    }

    if (type === 'subjects') {
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Professor</label>
              <select
                value={formData.professor_id || ''}
                onChange={(e) => setFormData({ ...formData, professor_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Professor</option>
                {users.filter(u => u.role === 'professor').map(professor => (
                  <option key={professor.id} value={professor.id}>
                    {professor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {item ? 'Edit' : 'Add'} {type.slice(0, -1)}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {renderForm()}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{item ? 'Update' : 'Create'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
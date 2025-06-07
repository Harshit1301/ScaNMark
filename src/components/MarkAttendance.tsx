import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Users, Check, X, RefreshCw, ChevronDown, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Subject, Student } from '../types';
import { 
  loadFaceRecognitionModels, 
  detectFacesInImage, 
  findMatchingStudents,
  createFaceDescriptorFromArray 
} from '../lib/faceRecognition';

interface MarkAttendanceProps {
  onAttendanceMarked?: () => void;
}

const MarkAttendance: React.FC<MarkAttendanceProps> = ({ onAttendanceMarked }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedStudents, setDetectedStudents] = useState<Student[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadSubjects();
    initializeFaceRecognition();
  }, [user]);

  const initializeFaceRecognition = async () => {
    setIsModelLoading(true);
    try {
      await loadFaceRecognitionModels();
    } catch (error) {
      console.error('Error loading face recognition models:', error);
    }
    setIsModelLoading(false);
  };

  const loadSubjects = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('subjects')
        .select(`
          *,
          professor:users(name)
        `);

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

  const loadEnrolledStudents = async (subjectId: string) => {
    try {
      const { data, error } = await supabase
        .from('subject_enrollments')
        .select(`
          student:students(*)
        `)
        .eq('subject_id', subjectId);

      if (!error && data) {
        const students = data.map(enrollment => enrollment.student).filter(Boolean);
        setEnrolledStudents(students);
      }
    } catch (error) {
      console.error('Error loading enrolled students:', error);
    }
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure camera permissions are enabled.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
        stopCamera();
        
        // Process facial recognition
        processFacialRecognition(imageDataUrl);
      }
    }
  }, [stopCamera]);

  const processFacialRecognition = async (imageDataUrl: string) => {
    if (!selectedSubject) return;
    
    setIsProcessing(true);
    
    try {
      // Create image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        try {
          // Detect faces in the captured image
          const detections = await detectFacesInImage(img);
          
          if (detections.length === 0) {
            alert('No faces detected in the image. Please try again.');
            setIsProcessing(false);
            return;
          }

          // Get face descriptors from detected faces
          const detectedDescriptors = detections.map(detection => detection.descriptor);
          
          // Get enrolled students with face encodings
          const studentsWithFaces = enrolledStudents.filter(student => 
            student.face_encoding && student.face_encoding.length > 0
          );

          if (studentsWithFaces.length === 0) {
            alert('No students have face encodings enrolled. Please enroll student faces first.');
            setIsProcessing(false);
            return;
          }

          // Create student descriptors array
          const studentDescriptors = studentsWithFaces.map(student => ({
            studentId: student.id,
            descriptor: createFaceDescriptorFromArray(student.face_encoding!)
          }));

          // Find matching students
          const matchedStudentIds = findMatchingStudents(detectedDescriptors, studentDescriptors);
          
          // Get matched student objects
          const matchedStudents = enrolledStudents.filter(student => 
            matchedStudentIds.includes(student.id)
          );

          setDetectedStudents(matchedStudents);
          setIsProcessing(false);
        } catch (error) {
          console.error('Error in face recognition:', error);
          alert('Error processing facial recognition. Please try again.');
          setIsProcessing(false);
        }
      };

      img.src = imageDataUrl;
    } catch (error) {
      console.error('Error processing facial recognition:', error);
      setIsProcessing(false);
    }
  };

  const markAttendance = async () => {
    if (!selectedSubject || !user) return;
    
    setIsProcessing(true);
    
    try {
      // Create attendance record
      const { data: attendanceRecord, error: recordError } = await supabase
        .from('attendance_records')
        .insert([{
          subject_id: selectedSubject.id,
          date: new Date().toISOString().split('T')[0],
          marked_by: user.id
        }])
        .select()
        .single();

      if (recordError || !attendanceRecord) {
        throw new Error('Failed to create attendance record');
      }

      // Create attendance entries for all enrolled students
      const attendanceEntries = enrolledStudents.map(student => ({
        attendance_record_id: attendanceRecord.id,
        student_id: student.id,
        status: detectedStudents.some(detected => detected.id === student.id) ? 'present' : 'absent'
      }));

      const { error: entriesError } = await supabase
        .from('attendance_entries')
        .insert(attendanceEntries);

      if (entriesError) {
        throw new Error('Failed to save attendance entries');
      }

      setAttendanceMarked(true);
      setIsProcessing(false);
      
      // Call callback to refresh dashboard data
      if (onAttendanceMarked) {
        onAttendanceMarked();
      }
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        resetSession();
      }, 3000);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error saving attendance. Please try again.');
      setIsProcessing(false);
    }
  };

  const resetSession = () => {
    setSelectedSubject(null);
    setEnrolledStudents([]);
    setCapturedImage(null);
    setDetectedStudents([]);
    setAttendanceMarked(false);
    setIsProcessing(false);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setDetectedStudents([]);
    startCamera();
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDropdownOpen(false);
    loadEnrolledStudents(subject.id);
  };

  if (isModelLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Face Recognition Models</h2>
          <p className="text-gray-600">Please wait while we initialize the facial recognition system...</p>
        </div>
      </div>
    );
  }

  if (attendanceMarked) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Attendance Marked Successfully!</h2>
          <p className="text-gray-600 mb-4">
            {detectedStudents.length} out of {enrolledStudents.length} students marked present
          </p>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subject:</span>
                <span className="font-medium">{selectedSubject?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Present:</span>
                <span className="font-medium text-green-600">{detectedStudents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Absent:</span>
                <span className="font-medium text-red-600">
                  {enrolledStudents.length - detectedStudents.length}
                </span>
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
          <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-gray-600 mt-1">Select a subject and capture class photo for automatic attendance</p>
        </div>
        {(capturedImage || isCapturing) && (
          <button
            onClick={resetSession}
            className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Start Over</span>
          </button>
        )}
      </div>

      {!selectedSubject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Subject</h2>
            <p className="text-gray-600">Choose the subject for which you want to mark attendance</p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <span className="text-gray-700">Select a subject...</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => handleSubjectSelect(subject)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{subject.name}</p>
                          <p className="text-sm text-gray-600">{subject.code}</p>
                        </div>
                      </button>
                    ))}
                    {subjects.length === 0 && (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        No subjects available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedSubject && !isCapturing && !capturedImage && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Subject Selected</h2>
            <p className="text-gray-600 mb-4">{selectedSubject.name} ({selectedSubject.code})</p>
            <p className="text-sm text-gray-500 mb-6">
              {enrolledStudents.length} students enrolled in this subject
            </p>
            {enrolledStudents.filter(s => s.face_encoding).length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  ⚠️ No students have face encodings enrolled. Please add student photos in the admin panel first.
                </p>
              </div>
            )}
          </div>

          <div className="max-w-md mx-auto">
            <button
              onClick={startCamera}
              disabled={enrolledStudents.filter(s => s.face_encoding).length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-6 h-6" />
              <span>Start Camera</span>
            </button>
          </div>
        </div>
      )}

      {isCapturing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Position Students in Frame</h2>
            <p className="text-gray-600">Make sure all students are visible in the camera view</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none opacity-50"></div>
          </div>

          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={stopCamera}
              className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={captureImage}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
            >
              <Camera className="w-5 h-5" />
              <span>Capture Photo</span>
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {capturedImage && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isProcessing ? 'Processing Image...' : 'Recognition Complete'}
            </h2>
            <p className="text-gray-600">
              {isProcessing 
                ? 'AI is analyzing faces and matching with enrolled students'
                : `Detected ${detectedStudents.length} out of ${enrolledStudents.length} students`
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Captured Image</h3>
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured class"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Analyzing faces...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Attendance Status</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {enrolledStudents.map((student) => {
                  const isPresent = detectedStudents.some(s => s.id === student.id);
                  const hasFaceEncoding = student.face_encoding && student.face_encoding.length > 0;
                  
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border ${
                        isProcessing
                          ? 'border-gray-200 bg-gray-50'
                          : !hasFaceEncoding
                          ? 'border-yellow-200 bg-yellow-50'
                          : isPresent
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <img
                        src={student.profile_image || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop'}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.roll_number}</p>
                      </div>
                      <div className="flex items-center">
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : !hasFaceEncoding ? (
                          <div className="flex items-center space-x-1 text-yellow-600">
                            <X className="w-5 h-5" />
                            <span className="text-sm font-medium">No Face Data</span>
                          </div>
                        ) : isPresent ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Check className="w-5 h-5" />
                            <span className="text-sm font-medium">Present</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-red-600">
                            <X className="w-5 h-5" />
                            <span className="text-sm font-medium">Absent</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {!isProcessing && (
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={retakePhoto}
                className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Retake Photo</span>
              </button>
              <button
                onClick={markAttendance}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Check className="w-5 h-5" />
                <span>Confirm Attendance</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
import * as faceapi from 'face-api.js';

let isModelLoaded = false;

export const loadFaceRecognitionModels = async (): Promise<void> => {
  if (isModelLoaded) return;

  try {
    const MODEL_URL = '/models';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
    ]);
    
    isModelLoaded = true;
    console.log('Face recognition models loaded successfully');
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    throw new Error('Failed to load face recognition models');
  }
};

export const detectFacesInImage = async (imageElement: HTMLImageElement): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>[]> => {
  if (!isModelLoaded) {
    await loadFaceRecognitionModels();
  }

  const detections = await faceapi
    .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

  return detections;
};

export const getFaceDescriptor = async (imageElement: HTMLImageElement): Promise<Float32Array | null> => {
  if (!isModelLoaded) {
    await loadFaceRecognitionModels();
  }

  const detection = await faceapi
    .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection?.descriptor || null;
};

export const compareFaces = (descriptor1: Float32Array, descriptor2: Float32Array, threshold: number = 0.6): boolean => {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  return distance < threshold;
};

export const findMatchingStudents = (
  detectedDescriptors: Float32Array[],
  studentDescriptors: { studentId: string; descriptor: Float32Array }[],
  threshold: number = 0.6
): string[] => {
  const matchedStudentIds: string[] = [];

  detectedDescriptors.forEach(detectedDesc => {
    studentDescriptors.forEach(({ studentId, descriptor }) => {
      if (compareFaces(detectedDesc, descriptor, threshold)) {
        if (!matchedStudentIds.includes(studentId)) {
          matchedStudentIds.push(studentId);
        }
      }
    });
  });

  return matchedStudentIds;
};

export const createFaceDescriptorFromArray = (array: number[]): Float32Array => {
  return new Float32Array(array);
};
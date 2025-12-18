/**
 * Server Storage Utility - Uses Hostinger server storage
 * Uploads files to your Next.js server's public/uploads directory
 * 
 * This is a free alternative to Firebase Storage using your existing hosting
 */

// File validation constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

/**
 * Validates file before upload
 */
export function validateFile(file: File, type: 'image' | 'video'): { valid: boolean; error?: string } {
  if (type === 'image') {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid image type. Please upload JPEG, PNG, WebP, or GIF.' };
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return { valid: false, error: `Image size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit.` };
    }
  } else if (type === 'video') {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid video type. Please upload MP4, WebM, or MOV.' };
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return { valid: false, error: `Video size exceeds ${MAX_VIDEO_SIZE / 1024 / 1024}MB limit.` };
    }
  }
  return { valid: true };
}

/**
 * Compresses/resizes image using canvas (same as Firebase version)
 */
export function compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads file to server storage
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Parse path to extract folder and subfolder
    // Path format: "classes/CLASS_123/thumbnail.png" or "profiles/user123/profile.png"
    const pathParts = path.split('/');
    const folder = pathParts[0] || 'uploads'; // e.g., 'classes', 'profiles', 'recordings'
    const subfolder = pathParts.slice(1, -1).join('/'); // Everything except last part (filename)

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (subfolder) {
      formData.append('subfolder', subfolder);
    }

    // Upload to server
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.url;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Uploads image with compression
 */
export async function uploadImage(
  file: File,
  path: string,
  compress: boolean = true,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Validate file
  const validation = validateFile(file, 'image');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Compress if needed
  let fileToUpload = file;
  if (compress) {
    try {
      fileToUpload = await compressImage(file);
    } catch (error) {
      console.warn('Image compression failed, uploading original:', error);
      fileToUpload = file;
    }
  }

  // Upload to server storage
  return await uploadFile(fileToUpload, path, onProgress);
}

/**
 * Uploads video file
 */
export async function uploadVideo(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Validate file
  const validation = validateFile(file, 'video');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Upload to server storage
  return await uploadFile(file, path, onProgress);
}

/**
 * Deletes file from server storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const response = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete file');
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Generates storage path for profile images
 */
export function getProfileImagePath(userId: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  return `profiles/${userId}/profile_${timestamp}.${extension}`;
}

/**
 * Generates storage path for class thumbnails
 */
export function getClassThumbnailPath(classId: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  return `classes/${classId}/thumbnail_${timestamp}.${extension}`;
}

/**
 * Generates storage path for class recordings
 */
export function getClassRecordingPath(classId: string, batchId: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  return `recordings/${classId}/${batchId}/recording_${timestamp}.${extension}`;
}


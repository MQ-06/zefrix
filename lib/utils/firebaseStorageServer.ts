/**
 * Firebase Storage Server Utility
 * Server-side file upload, deletion, and management using Firebase Admin SDK
 * 
 * This utility handles all file uploads to Firebase Storage:
 * - Profile images
 * - Class thumbnails/banners
 * - Video files
 * - Recordings
 * - Other media files
 */

import admin from '@/lib/firebase-admin';
import { Readable } from 'stream';

const storage = admin.storage();
const bucket = storage.bucket(); // Uses default bucket from Firebase config

// File validation constants
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mpeg'];

/**
 * Validates file before upload
 */
export function validateFile(
  file: { size: number; mimetype: string },
  type: 'image' | 'video'
): { valid: boolean; error?: string } {
  if (type === 'image') {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid image type. Please upload JPEG, PNG, WebP, or GIF.' };
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return { valid: false, error: `Image size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit.` };
    }
  } else if (type === 'video') {
    if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid video type. Please upload MP4, WebM, MOV, or MPEG.' };
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return { valid: false, error: `Video size exceeds ${MAX_VIDEO_SIZE / 1024 / 1024}MB limit.` };
    }
  }
  return { valid: true };
}

/**
 * Uploads file buffer to Firebase Storage
 * @param buffer - File buffer
 * @param path - Storage path (e.g., "profiles/user123/profile.jpg")
 * @param mimetype - File MIME type
 * @returns Public download URL
 */
export async function uploadFile(
  buffer: Buffer,
  path: string,
  mimetype: string
): Promise<string> {
  try {
    const file = bucket.file(path);
    
    // Create a write stream
    const stream = file.createWriteStream({
      metadata: {
        contentType: mimetype,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    // Convert buffer to stream and upload
    await new Promise<void>((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Upload stream error:', error);
        reject(error);
      });
      
      stream.on('finish', () => {
        resolve();
      });

      const readable = Readable.from(buffer);
      readable.pipe(stream);
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
    
    return publicUrl;
  } catch (error: any) {
    console.error('Firebase Storage upload error:', error);
    throw new Error(`Failed to upload file to Firebase Storage: ${error.message}`);
  }
}

/**
 * Uploads file from FormData File object to Firebase Storage
 * @param file - File object from FormData
 * @param path - Storage path
 * @returns Public download URL
 */
export async function uploadFileFromFormData(
  file: File,
  path: string
): Promise<string> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Firebase Storage
    return await uploadFile(buffer, path, file.type);
  } catch (error: any) {
    console.error('File upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Deletes file from Firebase Storage
 * @param path - Storage path to delete
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const file = bucket.file(path);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`File does not exist: ${path}`);
      return; // Don't throw error if file doesn't exist (idempotent)
    }

    await file.delete();
  } catch (error: any) {
    console.error('Firebase Storage delete error:', error);
    throw new Error(`Failed to delete file from Firebase Storage: ${error.message}`);
  }
}

/**
 * Gets download URL for a file (signed URL if needed, or public URL)
 * @param path - Storage path
 * @param expiresIn - Expiration time in seconds (for signed URLs, default: 1 hour)
 * @returns Download URL
 */
export async function getDownloadURL(path: string, expiresIn: number = 3600): Promise<string> {
  try {
    const file = bucket.file(path);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found: ${path}`);
    }

    // Get public URL (if file is public)
    try {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
      // Verify it's accessible by checking metadata
      const [metadata] = await file.getMetadata();
      if (metadata.metadata?.public === 'true' || metadata.iamConfiguration?.publicAccessPrevention !== 'enforced') {
        return publicUrl;
      }
    } catch {
      // If public access fails, generate signed URL
    }

    // Generate signed URL for private files
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });

    return url;
  } catch (error: any) {
    console.error('Firebase Storage get URL error:', error);
    throw new Error(`Failed to get download URL: ${error.message}`);
  }
}

/**
 * Generates storage path for profile images
 */
export function getProfileImagePath(userId: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
  return `profiles/${userId}/profile_${timestamp}.${extension}`;
}

/**
 * Generates storage path for class thumbnails
 */
export function getClassThumbnailPath(classId: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
  return `classes/${classId}/thumbnail_${timestamp}.${extension}`;
}

/**
 * Generates storage path for class recordings
 */
export function getClassRecordingPath(classId: string, batchId: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop()?.toLowerCase() || 'mp4';
  return `recordings/${classId}/${batchId}/recording_${timestamp}.${extension}`;
}

/**
 * Generates storage path for videos
 */
export function getVideoPath(folder: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop()?.toLowerCase() || 'mp4';
  return `videos/${folder}/${timestamp}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}.${extension}`;
}


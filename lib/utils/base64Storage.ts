/**
 * Base64 Storage Utility - Free alternative to Firebase Storage
 * Stores images as Base64 strings in Firestore
 * 
 * ⚠️ LIMITATIONS:
 * - Only for small images (< 1 MB)
 * - Not suitable for videos
 * - Increases Firestore document size
 * - Slower than dedicated storage
 * 
 * Use this if you can't use Firebase Storage or Cloudflare R2
 */

import { validateFile, compressImage } from './firebaseStorage';

const MAX_BASE64_SIZE = 900 * 1024; // ~900 KB (leave room for Firestore overhead)

/**
 * Converts file to Base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads image as Base64 (stores directly in Firestore)
 * Returns the Base64 data URL
 */
export async function uploadImageAsBase64(
  file: File,
  compress: boolean = true
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
      fileToUpload = await compressImage(file, 800, 800, 0.7); // Smaller size for Base64
    } catch (error) {
      console.warn('Image compression failed, using original:', error);
      fileToUpload = file;
    }
  }

  // Check file size
  if (fileToUpload.size > MAX_BASE64_SIZE) {
    throw new Error(`Image too large for Base64 storage. Maximum size is ${MAX_BASE64_SIZE / 1024} KB. Please use a smaller image or enable Firebase Storage.`);
  }

  // Convert to Base64
  const base64String = await fileToBase64(fileToUpload);
  
  // Check Base64 string size
  if (base64String.length > MAX_BASE64_SIZE) {
    throw new Error('Image too large after conversion. Please use a smaller image.');
  }

  return base64String;
}

/**
 * Uploads video as Base64 (NOT RECOMMENDED - videos are too large)
 * This will likely fail for most videos
 */
export async function uploadVideoAsBase64(file: File): Promise<string> {
  const validation = validateFile(file, 'video');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Videos are almost always too large for Base64
  if (file.size > MAX_BASE64_SIZE) {
    throw new Error(`Video too large for Base64 storage. Maximum size is ${MAX_BASE64_SIZE / 1024} KB. Videos require Firebase Storage or Cloudflare R2.`);
  }

  return await fileToBase64(file);
}

/**
 * Checks if a Base64 string is valid
 */
export function isValidBase64(base64String: string): boolean {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }
  
  // Check if it's a data URL
  if (base64String.startsWith('data:')) {
    return true;
  }
  
  // Check if it's a valid Base64 string
  try {
    return btoa(atob(base64String)) === base64String;
  } catch {
    return false;
  }
}

/**
 * Gets file size from Base64 string (approximate)
 */
export function getBase64Size(base64String: string): number {
  if (!base64String) return 0;
  
  // Remove data URL prefix if present
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  // Approximate size: Base64 is ~33% larger than original
  return (base64Data.length * 3) / 4;
}


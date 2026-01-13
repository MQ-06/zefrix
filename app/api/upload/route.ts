import { NextRequest, NextResponse } from 'next/server';
import {
  uploadFileFromFormData,
  validateFile,
  getProfileImagePath,
  getClassThumbnailPath,
  getClassRecordingPath,
  deleteFile as deleteStorageFile,
} from '@/lib/utils/firebaseStorageServer';

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads'; // e.g., 'classes', 'profiles', 'recordings'
    const subfolder = formData.get('subfolder') as string || ''; // e.g., classId, userId, batchId
    const uploadType = formData.get('uploadType') as string || 'generic'; // 'profile', 'class', 'recording', 'generic'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Determine file type (image or video)
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images and videos are allowed.' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(
      { size: file.size, mimetype: file.type },
      isImage ? 'image' : 'video'
    );

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Generate storage path based on folder type or explicit uploadType
    let storagePath: string;
    
    // Auto-detect upload type from folder if uploadType not explicitly provided
    const detectedType = uploadType !== 'generic' ? uploadType : 
                         (folder === 'profiles' ? 'profile' :
                          folder === 'classes' ? 'class' :
                          folder === 'recordings' ? 'recording' : 'generic');
    
    if (detectedType === 'profile' && subfolder) {
      // Profile image upload - use the path helper or reconstruct from folder/subfolder
      storagePath = getProfileImagePath(subfolder, file.name);
    } else if (detectedType === 'class' && subfolder) {
      // Class thumbnail upload
      storagePath = getClassThumbnailPath(subfolder, file.name);
    } else if (detectedType === 'recording' && subfolder && folder) {
      // Recording upload (folder = classId, subfolder = batchId)
      // Note: For recordings, the path structure might be different
      // If folder is actually the classId from the path structure
      const pathParts = subfolder.split('/');
      if (pathParts.length >= 2) {
        // Structure: recordings/classId/batchId/filename
        storagePath = getClassRecordingPath(pathParts[0], pathParts[1], file.name);
      } else {
        storagePath = getClassRecordingPath(folder, subfolder, file.name);
      }
    } else {
      // Generic upload - preserve the original path structure from client
      // The client sends paths like "profiles/user123/profile_timestamp.jpg"
      // which gets parsed into folder="profiles", subfolder="user123"
      // We need to reconstruct the full path with the filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop()?.toLowerCase() || (isImage ? 'jpg' : 'mp4');
      const baseFileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      const sanitizedName = baseFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      storagePath = `${folder}${subfolder ? `/${subfolder}` : ''}/${sanitizedName}_${timestamp}.${extension}`;
    }

    console.log('📁 [UPLOAD API] Uploading to Firebase Storage:', {
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder,
      subfolder,
      uploadType,
    });

    // Upload to Firebase Storage
    const publicUrl = await uploadFileFromFormData(file, storagePath);

    console.log('✅ [UPLOAD API] File uploaded successfully:', {
      storagePath,
      publicUrl,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath,
      filename: file.name,
      size: file.size,
      type: file.type,
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Handle file deletion from Firebase Storage
export async function DELETE(request: NextRequest) {
  try {
    // Try to get path from query params or request body
    const { searchParams } = new URL(request.url);
    let filePath = searchParams.get('path');
    
    // If not in query params, try request body
    if (!filePath) {
      try {
        const body = await request.json();
        filePath = body.path;
      } catch {
        // Body might not be JSON
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      );
    }

    // Security: Validate path format (should be Firebase Storage path, not filesystem path)
    // Remove any leading slashes and validate it's a valid storage path
    filePath = filePath.replace(/^\/+/, '');
    
    // Validate path doesn't contain dangerous patterns
    if (filePath.includes('..') || filePath.includes('//')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      );
    }

    console.log('🗑️ [DELETE API] Deleting from Firebase Storage:', { filePath });

    // Delete from Firebase Storage
    await deleteStorageFile(filePath);

    console.log('✅ [DELETE API] File deleted successfully:', { filePath });

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error: any) {
    console.error('❌ Delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}


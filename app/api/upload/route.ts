import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Maximum file sizes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads'; // e.g., 'classes', 'profiles', 'recordings'
    const subfolder = formData.get('subfolder') as string || ''; // e.g., classId, userId, batchId

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images and videos are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Image size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit.` },
        { status: 400 }
      );
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { success: false, error: `Video size exceeds ${MAX_VIDEO_SIZE / 1024 / 1024}MB limit.` },
        { status: 400 }
      );
    }

    // Create upload directory structure
    // For Hostinger: Use public/uploads for public access
    // Alternative: Use storage/uploads (outside public) for better security
    const usePublicDir = process.env.UPLOAD_TO_PUBLIC !== 'false'; // Default to true for Hostinger
    const baseDir = usePublicDir 
      ? path.join(process.cwd(), 'public', 'uploads', folder, subfolder)
      : path.join(process.cwd(), 'storage', 'uploads', folder, subfolder);
    
    const uploadDir = baseDir;
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const uniqueFileName = `${baseName}_${timestamp}${extension}`;

    // Save file
    const filePath = path.join(uploadDir, uniqueFileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Generate public URL
    // For Hostinger: Use your domain
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://zefrix.com';
    const relativePath = `uploads/${folder}${subfolder ? `/${subfolder}` : ''}/${uniqueFileName}`;
    const publicUrl = `${baseUrl}/${relativePath}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: relativePath,
      filename: uniqueFileName,
      size: file.size,
      type: file.type,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Handle file deletion
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

    // Security: Only allow deletion of files in uploads directory
    if (!filePath.startsWith('uploads/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Support both public/uploads and storage/uploads
    const usePublicDir = process.env.UPLOAD_TO_PUBLIC !== 'false';
    const baseDir = usePublicDir ? 'public' : 'storage';
    const fullPath = path.join(process.cwd(), baseDir, filePath);
    
    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete file
    const { unlink } = await import('fs/promises');
    await unlink(fullPath);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { existsSync, accessSync, constants } from 'fs';
import path from 'path';

/**
 * Diagnostic endpoint to check upload configuration
 * Visit: /api/upload/check
 */
export async function GET(request: NextRequest) {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
    errors: [],
    warnings: [],
  };

  try {
    // Check 1: Upload directory exists and is writable
    const usePublicDir = process.env.UPLOAD_TO_PUBLIC !== 'false';
    const baseDir = usePublicDir 
      ? path.join(process.cwd(), 'public', 'uploads')
      : path.join(process.cwd(), 'storage', 'uploads');
    
    checks.checks.uploadDirectory = {
      path: baseDir,
      exists: existsSync(baseDir),
      writable: false,
    };

    if (existsSync(baseDir)) {
      try {
        accessSync(baseDir, constants.W_OK);
        checks.checks.uploadDirectory.writable = true;
      } catch (err: any) {
        checks.checks.uploadDirectory.writable = false;
        checks.errors.push(`Upload directory is not writable: ${baseDir}`);
      }
    } else {
      checks.warnings.push(`Upload directory does not exist: ${baseDir}. It will be created on first upload.`);
    }

    // Check 2: Subdirectories
    const subdirs = ['profiles', 'classes', 'recordings'];
    checks.checks.subdirectories = {};
    subdirs.forEach(subdir => {
      const subdirPath = path.join(baseDir, subdir);
      checks.checks.subdirectories[subdir] = {
        path: subdirPath,
        exists: existsSync(subdirPath),
      };
    });

    // Check 3: Environment variables
    checks.checks.environment = {
      UPLOAD_TO_PUBLIC: process.env.UPLOAD_TO_PUBLIC || 'true (default)',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'not set',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'not set',
    };

    if (!process.env.NEXT_PUBLIC_BASE_URL && !process.env.NEXT_PUBLIC_SITE_URL) {
      checks.warnings.push('NEXT_PUBLIC_BASE_URL or NEXT_PUBLIC_SITE_URL should be set for production');
    }

    // Check 4: Process working directory
    checks.checks.processInfo = {
      cwd: process.cwd(),
      platform: process.platform,
      nodeVersion: process.version,
    };

    // Check 5: Request origin (for URL generation)
    try {
      const origin = request.nextUrl.origin;
      checks.checks.requestOrigin = origin;
    } catch (err) {
      checks.warnings.push('Could not determine request origin');
    }

    // Overall status
    const hasErrors = checks.errors.length > 0;
    const hasWarnings = checks.warnings.length > 0;
    
    checks.status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok';
    checks.message = hasErrors 
      ? 'Upload configuration has errors. Please fix them before uploading files.'
      : hasWarnings 
      ? 'Upload configuration has warnings. Uploads may work but check recommendations.'
      : 'Upload configuration looks good!';

    return NextResponse.json(checks, {
      status: hasErrors ? 500 : 200,
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check upload configuration',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}


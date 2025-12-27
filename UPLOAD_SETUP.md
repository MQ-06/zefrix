# File Upload Server Configuration Guide

## Problem
Profile image uploads work locally but fail on the server. This is usually due to filesystem permissions or serverless platform limitations.

## Common Issues & Solutions

### 1. **Filesystem Write Permissions**

**Problem:** Server doesn't have write access to the upload directory.

**Solution for Hostinger/VPS:**
```bash
# SSH into your server and run:
cd /path/to/your/project
mkdir -p public/uploads/profiles
mkdir -p public/uploads/classes
mkdir -p public/uploads/recordings

# Set proper permissions (adjust user/group as needed)
chmod -R 755 public/uploads
chown -R www-data:www-data public/uploads  # For Apache
# OR
chown -R nginx:nginx public/uploads        # For Nginx
```

**Check permissions:**
```bash
ls -la public/uploads
# Should show drwxr-xr-x permissions
```

### 2. **Serverless Platforms (Vercel, Netlify, etc.)**

**Problem:** These platforms have read-only filesystems. Files uploaded during runtime are lost.

**Solution:** Use external storage instead:
- **Firebase Storage** (recommended)
- **AWS S3**
- **Cloudinary**
- **Supabase Storage**

**To switch to Firebase Storage:**
1. Update your imports in `components/CreatorDashboard/Profile.tsx`:
```typescript
// Change from:
import { uploadImage, getProfileImagePath, validateFile } from '@/lib/utils/serverStorage';

// To:
import { uploadImage, getProfileImagePath, validateFile } from '@/lib/utils/firebaseStorage';
```

2. Ensure Firebase Storage is enabled in Firebase Console
3. Configure Firebase Storage security rules

### 3. **Next.js Configuration**

**For Hostinger/VPS hosting:**

Create or update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure public directory is served
  output: 'standalone', // Optional: for better server deployment
  
  // Increase body size limit for file uploads
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Adjust as needed
    },
  },
}

module.exports = nextConfig
```

### 4. **Environment Variables**

Create `.env.local` or set on your server:
```env
# For server-side uploads (Hostinger/VPS)
UPLOAD_TO_PUBLIC=true

# Base URL for file URLs (important for production)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 5. **Nginx Configuration (if using Nginx)**

Add to your Nginx config:
```nginx
server {
    # ... other config ...
    
    # Increase client body size for file uploads
    client_max_body_size 10M;
    
    # Ensure uploads directory is accessible
    location /uploads {
        alias /path/to/your/project/public/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6. **Apache Configuration (if using Apache)**

Add to `.htaccess` or Apache config:
```apache
# Increase upload size
php_value upload_max_filesize 10M
php_value post_max_size 10M

# Ensure uploads directory is accessible
<Directory "/path/to/your/project/public/uploads">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

### 7. **Testing Upload Functionality**

Test the upload endpoint:
```bash
# Test from server
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-image.jpg" \
  -F "folder=profiles" \
  -F "subfolder=test123"

# Should return JSON with success: true and url
```

### 8. **Debugging Steps**

1. **Check server logs:**
   - Look for errors in your server logs
   - Check Next.js console output

2. **Test directory permissions:**
   ```bash
   # On server
   touch public/uploads/test.txt
   # If this fails, permissions are the issue
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```

4. **Verify API route is accessible:**
   - Visit: `https://yourdomain.com/api/upload` (should return 405 Method Not Allowed, not 404)

### 9. **Alternative: Use Firebase Storage (Recommended for Production)**

If server filesystem uploads continue to fail, switch to Firebase Storage:

1. **Enable Firebase Storage:**
   - Go to Firebase Console → Storage
   - Click "Get Started"
   - Choose "Start in test mode" (or configure rules)

2. **Update Security Rules:**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /profiles/{userId}/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       match /classes/{classId}/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

3. **Update code to use Firebase Storage:**
   - Change imports as shown in section 2 above

### 10. **Quick Fix: Check Current Error**

Check browser console and network tab when uploading:
- Look for error messages in the API response
- Check if `/api/upload` endpoint is being called
- Verify the response status code

## Recommended Solution

**For Production:** Use Firebase Storage (already configured in your codebase)
- More reliable
- Scalable
- No server filesystem issues
- CDN delivery

**For Development/Local:** Server storage works fine

## Need Help?

If uploads still fail after trying these solutions:
1. Check browser console for specific error messages
2. Check server logs for detailed errors
3. Verify your hosting platform supports file writes
4. Consider switching to Firebase Storage for production


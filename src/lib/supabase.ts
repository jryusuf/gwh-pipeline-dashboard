import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Uploads an avatar image to Supabase Storage
 *
 * Note: The 'avatars' bucket needs to be created in the Supabase Storage dashboard:
 * 1. Go to Supabase Dashboard > Storage
 * 2. Create a new bucket named 'avatars'
 * 3. Set the bucket to public read access for avatar images to be accessible
 * 4. Configure RLS policies as needed for your security requirements
 *
 * @param file - The File object to upload
 * @param userId - The user ID to associate with the avatar
 * @returns Object containing success status, URL, and error information
 */
export async function uploadAvatar(file: File, userId: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    console.log('Avatar upload attempt:', { userId, fileName: file.name, fileType: file.type, fileSize: file.size });
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('Invalid file type rejected:', file.type);
      return {
        success: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'
      };
    }

    
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
          console.log('File size rejected:', file.size);
          return {
            success: false,
            error: 'File size too large. Maximum file size is 5MB.'
          };
        }
    // Generate unique filename to prevent conflicts
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const uniqueFilename = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

    // Upload file to Supabase Storage
    console.log('Attempting to upload to avatars bucket with filename:', uniqueFilename);
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(uniqueFilename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      console.log('Error details:', {
        message: error.message,
        details: (error as any).details
      });
      
      // Check for RLS policy violations
      let errorMessage = `Upload failed: ${error.message}`;
      if (error.message.includes('row-level security') ||
          error.message.includes('permission') ||
          error.message.includes('denied') ||
          error.message.includes('Unauthorized')) {
        errorMessage = "You don't have permission to upload avatars. Please contact an administrator to check your account permissions.";
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
    
    console.log('Upload successful, data:', data);

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(uniqueFilename);
    
    console.log('Generated public URL:', publicUrl);

    return {
      success: true,
      url: publicUrl
    };

  } catch (error: any) {
    console.error('Avatar upload error:', error);
    
    // Check for RLS policy violations in catch block
    let errorMessage = 'An unexpected error occurred during upload.';
    if (error?.message && (error.message.includes('row-level security') ||
                             error.message.includes('permission') ||
                             error.message.includes('denied') ||
                             error.message.includes('Unauthorized'))) {
      errorMessage = "You don't have permission to upload avatars. Please contact an administrator to check your account permissions.";
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

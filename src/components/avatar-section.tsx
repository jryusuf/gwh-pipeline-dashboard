"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircleIcon, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { uploadAvatar } from "@/lib/supabase";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";

interface AvatarSectionProps {
  user: User | null;
  onAvatarUpdate?: (avatarUrl: string) => void;
}

export function AvatarSection({ user, onAvatarUpdate }: AvatarSectionProps) {
  const { updateProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      // Reset messages
      setSuccessMessage(null);
      setErrorMessage(null);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size must be less than 5MB");
        return;
      }

      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Actual upload
      setIsUploading(true);
      try {
        console.log('Calling uploadAvatar with user ID:', user.id);
        const { success, url: avatarUrl, error } = await uploadAvatar(file, user.id);
        console.log('uploadAvatar result:', { success, avatarUrl, error });
        
        if (success && avatarUrl) {
          setUploadedAvatarUrl(avatarUrl);
          
          // Automatically save avatar URL to user profile metadata
          try {
            console.log('Auto-saving avatar URL to profile metadata:', avatarUrl);
            const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
            const { success: profileUpdateSuccess, error: profileUpdateError } = await updateProfile(displayName, avatarUrl);
            console.log('Profile update result:', { profileUpdateSuccess, profileUpdateError });
            
            if (profileUpdateSuccess) {
              console.log('Avatar URL auto-saved to profile successfully');
            } else {
              console.error('Failed to auto-save avatar URL to profile:', profileUpdateError);
              setErrorMessage("Avatar uploaded but failed to save to profile. Please try saving manually.");
            }
          } catch (profileUpdateError: any) {
            console.error('Error auto-saving avatar URL to profile:', profileUpdateError);
            setErrorMessage("Avatar uploaded but failed to save to profile. Please try saving manually.");
          }
          
          // Notify parent component of avatar update
          if (onAvatarUpdate) {
            console.log('Calling onAvatarUpdate with URL:', avatarUrl);
            onAvatarUpdate(avatarUrl);
          }
          
          setSuccessMessage("Avatar uploaded and automatically saved to your profile!");
          setPreviewUrl(null); // Clear preview since we're showing the actual avatar now
          setIsUploading(false);
        } else {
          console.log('Upload failed with error:', error);
          // Check for RLS policy violations
          if (error && (error.includes('row-level security') || error.includes('permission') || error.includes('denied'))) {
            setErrorMessage("You don't have permission to upload avatars. Please contact an administrator to check your account permissions.");
          } else {
            setErrorMessage(error || "Upload failed. Please try again.");
          }
          setIsUploading(false);
        }
      } catch (uploadError: any) {
        console.error('Upload error:', uploadError);
        // Check for RLS policy violations in catch block
        if (uploadError?.message && (uploadError.message.includes('row-level security') || uploadError.message.includes('permission') || uploadError.message.includes('denied'))) {
          setErrorMessage("You don't have permission to upload avatars. Please contact an administrator to check your account permissions.");
        } else {
          setErrorMessage("An unexpected error occurred during upload.");
        }
        setIsUploading(false);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (email: string | undefined) => {
    if (!email) return "U";
    const name = email.split("@")[0];
    return name.substring(0, 2).toUpperCase();
  };

  const getCurrentAvatarUrl = () => {
    return previewUrl || uploadedAvatarUrl || user?.user_metadata?.avatar_url;
  };

  const isLoading = isUploading;

  return (
    <div className="space-y-4">
      {successMessage && (
        <Alert variant="default" className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-200">
          <CheckCircleIcon className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-6">
        <div className="relative">
          {getCurrentAvatarUrl() ? (
            <img
              src={getCurrentAvatarUrl()!}
              alt="Profile avatar"
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <span className="text-2xl font-semibold">
                {getInitials(user?.email)}
              </span>
            </div>
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Spinner className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileInput}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                Uploading...
                <Spinner className="h-4 w-4" />
              </span>
            ) : (
              "Change Avatar"
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            JPG, PNG or GIF (max. 5MB)
          </p>
        </div>
        
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
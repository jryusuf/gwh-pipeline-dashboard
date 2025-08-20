"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircleIcon, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface ProfileFormProps {
  user: User | null;
  avatarUrl?: string;
  onProfileUpdate?: () => void;
  refreshProfile?: () => void;
}

export function ProfileForm({ user, avatarUrl: initialAvatarUrl, onProfileUpdate, refreshProfile }: ProfileFormProps) {
  const { updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialAvatarUrl);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      console.log('User data in ProfileForm:', user);
      console.log('User metadata:', user.user_metadata);
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "");
    }
    setAvatarUrl(initialAvatarUrl);
  }, [user, initialAvatarUrl]);

  // Force refresh mechanism
  const triggerRefresh = () => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "");
      setAvatarUrl(initialAvatarUrl);
    }
  };

  // Expose force refresh to parent components
  useEffect(() => {
    if (refreshProfile) {
      // Call refresh when refreshProfile changes
      triggerRefresh();
    }
  }, [refreshProfile]);

  const validateDisplayName = (name: string): string | null => {
    if (name.length < 2) {
      return "Display name must be at least 2 characters";
    }
    if (name.length > 50) {
      return "Display name must be less than 50 characters";
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateDisplayName(displayName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    setSaveSuccess(false);

    try {
      console.log('Calling updateProfile with:', { displayName, avatarUrl });
      // Call the updateProfile function from AuthContext with both displayName and avatarUrl
      const { success, error: updateError } = await updateProfile(displayName, avatarUrl);
      console.log('updateProfile result:', { success, updateError });
      
      if (success) {
        console.log('Profile update successful');
        setSaveSuccess(true);
        setIsEditing(false);
        onProfileUpdate?.();
      } else {
        console.log('Profile update failed:', updateError);
        setError(updateError || "Failed to update profile. Please try again.");
      }
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "");
    }
    setIsEditing(false);
    setError("");
    setSaveSuccess(false);
  };

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <Alert variant="default" className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-200">
          <CheckCircleIcon className="h-4 w-4" />
          <AlertDescription>Profile updated successfully!</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ""}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Your email address cannot be changed
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={!isEditing}
            className={isEditing ? "" : "bg-muted"}
          />
          <p className="text-xs text-muted-foreground">
            This is how your name appears to others
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        {isEditing ? (
          <>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </div>
    </div>
  );
}
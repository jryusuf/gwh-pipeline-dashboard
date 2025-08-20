"use client";

import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarSection } from "./avatar-section";
import { ProfileForm } from "./profile-form";
import { useState, useEffect } from "react";

interface ProfileSettingsCardProps {
  user: User | null;
}

export function ProfileSettingsCard({ user }: ProfileSettingsCardProps) {
  // Manage avatar URL state at the ProfileSettingsCard level
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.user_metadata?.avatar_url);
  const [refreshKey, setRefreshKey] = useState(0);

  // Update avatar URL when user data changes
  useEffect(() => {
    if (user) {
      setAvatarUrl(user.user_metadata?.avatar_url);
    }
  }, [user]);

  // Force refresh mechanism
  const forceRefresh = () => {
    console.log('Force refresh triggered');
    // Update avatar URL from user data
    if (user) {
      setAvatarUrl(user.user_metadata?.avatar_url);
    }
    // Trigger refresh in child components
    setRefreshKey(prev => prev + 1);
  };

  // Implement handleAvatarUpdate callback to update the avatar URL state
  const handleAvatarUpdate = (newAvatarUrl: string) => {
    console.log('handleAvatarUpdate called with:', newAvatarUrl);
    setAvatarUrl(newAvatarUrl);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your profile information and manage your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AvatarSection user={user} onAvatarUpdate={handleAvatarUpdate} />
        <ProfileForm
          key={refreshKey}
          user={user}
          avatarUrl={avatarUrl}
          onProfileUpdate={() => {
            // Refresh after profile update
            setTimeout(() => forceRefresh(), 10);
          }}
        />
      </CardContent>
    </Card>
  );
}
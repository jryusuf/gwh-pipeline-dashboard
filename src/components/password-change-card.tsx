"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircleIcon, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function PasswordChangeCard() {
  const { updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous states
    setError("");
    setSaveSuccess(false);
    
    // Validate current password
    if (!currentPassword) {
      setError("Please enter your current password");
      return;
    }
    
    // Validate new passwords
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    const confirmPasswordError = validateConfirmPassword(newPassword, confirmPassword);
    if (confirmPasswordError) {
      setError(confirmPasswordError);
      return;
    }

    setIsSaving(true);
    
    try {
      const { success, error: updateError } = await updatePassword(currentPassword, newPassword);
      
      if (success) {
        setSaveSuccess(true);
        // Clear form fields
        setNewPassword("");
        setConfirmPassword("");
        setCurrentPassword("");
      } else {
        setError(updateError || "Failed to update password. Please try again.");
      }
    } catch (err) {
      setError("Failed to update password. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {saveSuccess && (
            <Alert variant="default" className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-200">
              <CheckCircleIcon className="h-4 w-4" />
              <AlertDescription>Password updated successfully!</AlertDescription>
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
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Change Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
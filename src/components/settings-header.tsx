"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsHeader() {
  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-3xl font-bold">Settings</CardTitle>
        <CardDescription className="text-base">
          Manage your account settings and preferences
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
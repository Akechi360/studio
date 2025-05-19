
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Settings as SettingsIcon } from 'lucide-react'; // Renamed to avoid conflict

export default function SettingsPage() {
  const { role } = useAuth();

  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <AlertTitle className="text-xl font-bold">Access Denied</AlertTitle>
          <AlertDescription className="mb-4">
            You do not have permission to access Settings. This area is restricted to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><SettingsIcon className="mr-3 h-8 w-8 text-primary" />Settings</h1>
        <p className="text-muted-foreground">
          Configure application settings and preferences.
        </p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Application Configuration</CardTitle>
          <CardDescription>Manage global settings for the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configuration options will be available here. You might be able to manage things like notification preferences, integrations, or other system-wide settings.</p>
          {/* Placeholder for settings form */}
          <div className="mt-6 p-8 border border-dashed rounded-lg text-center">
            <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="font-semibold">Configuration options will appear here.</p>
            <p className="text-sm text-muted-foreground">This is where various application settings will be managed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


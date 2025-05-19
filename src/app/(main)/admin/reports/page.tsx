
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  const { role } = useAuth();

  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <AlertTitle className="text-xl font-bold">Access Denied</AlertTitle>
          <AlertDescription className="mb-4">
            You do not have permission to access Reports. This area is restricted to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><BarChart3 className="mr-3 h-8 w-8 text-primary" />Reports</h1>
        <p className="text-muted-foreground">
          View system reports and analytics.
        </p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>System Analytics</CardTitle>
          <CardDescription>Generate and view various reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Reporting functionality will be implemented here. You'll be able to generate reports on ticket volume, resolution times, user activity, etc.</p>
          {/* Placeholder for reports dashboard */}
          <div className="mt-6 p-8 border border-dashed rounded-lg text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="font-semibold">Report data will appear here.</p>
            <p className="text-sm text-muted-foreground">This is where various system reports will be displayed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

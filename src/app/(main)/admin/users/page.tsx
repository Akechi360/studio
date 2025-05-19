
"use client";

import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Users } from 'lucide-react';

export default function UserManagementPage() {
  const { role } = useAuth();

  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <AlertTitle className="text-xl font-bold">Access Denied</AlertTitle>
          <AlertDescription className="mb-4">
            You do not have permission to access User Management. This area is restricted to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><Users className="mr-3 h-8 w-8 text-primary" />User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and permissions.
        </p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>View and manage all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">User management functionality will be implemented here. You'll be able to add, edit, and remove users, as well as assign roles.</p>
          {/* Placeholder for user table or list */}
           <div className="mt-6 p-8 border border-dashed rounded-lg text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="font-semibold">User data will appear here.</p>
            <p className="text-sm text-muted-foreground">This is where the list of users will be displayed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

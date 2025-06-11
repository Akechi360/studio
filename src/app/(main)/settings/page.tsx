"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Settings as SettingsIcon, Save, BellRing, Mail, MessageCircle, Paintbrush, Loader2 } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { getUserSettingsAction, updateUserSettingsAction } from '@/lib/actions';

interface NotificationPreferences {
  emailOnNewTicket: boolean;
  emailOnNewComment: boolean;
}

interface CustomizationPreferences {
  appName: string;
}

interface AdminSettings {
  notificationPrefs: NotificationPreferences;
  customizationPrefs: CustomizationPreferences;
}

const initialSettingsState: AdminSettings = {
  notificationPrefs: {
    emailOnNewTicket: true,
    emailOnNewComment: true,
  },
  customizationPrefs: {
    appName: APP_NAME,
  },
};

export default function SettingsPage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>(initialSettingsState);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const loadUserSettings = async () => {
      if (user?.id) {
        setIsLoadingSettings(true);
        const userDbSettings = await getUserSettingsAction(user.id);
        setSettings({
          notificationPrefs: {
            emailOnNewTicket: userDbSettings.emailOnNewTicket,
            emailOnNewComment: userDbSettings.emailOnNewComment,
          },
          customizationPrefs: {
            appName: userDbSettings.customAppName || APP_NAME,
          },
        });
        setIsLoadingSettings(false);
      }
    };

    if (!authLoading) {
      loadUserSettings();
    }
  }, [user, authLoading]);

  const handleNotificationPrefChange = (key: keyof NotificationPreferences, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notificationPrefs: { ...prev.notificationPrefs, [key]: value },
    }));
  };

  const handleCustomizationPrefChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setSettings(prev => ({
      ...prev,
      customizationPrefs: { ...prev.customizationPrefs, [name as keyof CustomizationPreferences]: value },
    }));
  };

  const handleSaveSettings = async () => {
    if (!user || !user.id || !user.email) {
      toast({ title: "Error", description: "No se pudo guardar la configuración. Usuario no autenticado.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const result = await updateUserSettingsAction(
      user.id,
      user.email,
      {
        emailOnNewTicket: settings.notificationPrefs.emailOnNewTicket,
        emailOnNewComment: settings.notificationPrefs.emailOnNewComment,
        customAppName: settings.customizationPrefs.appName,
      }
    );
    setIsSaving(false);

    if (result.success) {
      toast({
        title: "Configuración Guardada",
        description: result.message,
      });
    } else {
      toast({
        title: "Error al Guardar",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <AlertTitle className="text-xl font-bold">Acceso Denegado</AlertTitle>
          <AlertDescription className="mb-4">
            No tienes permiso para acceder a Configuración. Esta área está restringida a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingSettings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2 items-start">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><SettingsIcon className="mr-3 h-8 w-8 text-primary" />Configuración General</h1>
        <p className="text-muted-foreground">
          Configurar ajustes y preferencias de la aplicación.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><BellRing className="mr-2 h-5 w-5 text-primary"/>Preferencias de Notificación</CardTitle>
          <CardDescription>Gestiona cómo recibes las notificaciones por correo electrónico (simuladas).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg shadow-sm bg-muted/20">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-primary" />
              <Label htmlFor="emailOnNewTicket" className="font-medium">
                Recibir correo para nuevos tickets creados
              </Label>
            </div>
            <Switch
              id="emailOnNewTicket"
              checked={settings.notificationPrefs.emailOnNewTicket}
              onCheckedChange={(value) => handleNotificationPrefChange('emailOnNewTicket', value)}
              aria-label="Recibir correo para nuevos tickets creados"
            />
          </div>

          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg shadow-sm bg-muted/20">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-5 w-5 text-primary" />
              <Label htmlFor="emailOnNewComment" className="font-medium">
                Recibir correo para nuevos comentarios en mis tickets
              </Label>
            </div>
            <Switch
              id="emailOnNewComment"
              checked={settings.notificationPrefs.emailOnNewComment}
              onCheckedChange={(value) => handleNotificationPrefChange('emailOnNewComment', value)}
              aria-label="Recibir correo para nuevos comentarios en mis tickets"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Paintbrush className="mr-2 h-5 w-5 text-primary"/>Personalización de la Aplicación</CardTitle>
          <CardDescription>Ajusta la apariencia y el nombre de la aplicación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 p-4 border rounded-lg shadow-sm bg-muted/20">
            <Label htmlFor="appName" className="font-medium">Nombre de la Aplicación</Label>
            <Input
              id="appName"
              name="appName"
              value={settings.customizationPrefs.appName}
              onChange={handleCustomizationPrefChange}
              placeholder="Ej: Mi Sistema de Tickets"
            />
            <p className="text-xs text-muted-foreground pt-1">
              Este nombre se mostrará en la cabecera y páginas de inicio de sesión/registro.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin text-white" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Todos los Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

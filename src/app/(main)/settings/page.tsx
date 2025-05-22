
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
import { ShieldAlert, Settings as SettingsIcon, Save, BellRing, Mail, MessageCircle, Paintbrush } from 'lucide-react'; // Lightbulb removed
import { APP_NAME } from '@/lib/constants';

interface NotificationPreferences {
  emailOnNewTicket: boolean;
  emailOnNewComment: boolean;
}

// AIPreferences interface removed

interface CustomizationPreferences {
  appName: string;
}

interface AdminSettings {
  notificationPrefs: NotificationPreferences;
  // aiPrefs removed
  customizationPrefs: CustomizationPreferences;
}

const defaultSettings: AdminSettings = {
  notificationPrefs: {
    emailOnNewTicket: true,
    emailOnNewComment: true,
  },
  // aiPrefs removed
  customizationPrefs: {
    appName: APP_NAME, // Default from constants
  },
};

export default function SettingsPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);

  useEffect(() => {
    const savedSettingsRaw = localStorage.getItem('adminSettings');
    if (savedSettingsRaw) {
      try {
        const savedSettings = JSON.parse(savedSettingsRaw);
        // Merge with defaults to ensure all keys are present if structure changed
        setSettings(prev => ({
          ...defaultSettings,
          ...savedSettings,
          notificationPrefs: {
            ...defaultSettings.notificationPrefs,
            ...(savedSettings.notificationPrefs || {}),
          },
          // aiPrefs merging removed
          customizationPrefs: {
            ...defaultSettings.customizationPrefs,
            ...(savedSettings.customizationPrefs || {}),
          },
        }));
      } catch (error) {
        console.error("Error al cargar configuración de admin:", error);
        setSettings(defaultSettings); // Reset to defaults on error
      }
    }
  }, []);

  const handleNotificationPrefChange = (key: keyof NotificationPreferences, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notificationPrefs: { ...prev.notificationPrefs, [key]: value },
    }));
  };

  // handleAIPrefChange function removed
  
  const handleCustomizationPrefChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setSettings(prev => ({
      ...prev,
      customizationPrefs: { ...prev.customizationPrefs, [name as keyof CustomizationPreferences]: value },
    }));
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Configuración Guardada",
        description: "Tus preferencias han sido actualizadas.",
      });
    }, 700);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2 items-start">
        <h1 className="text-3xl font-bold tracking-tight flex items-center"><SettingsIcon className="mr-3 h-8 w-8 text-primary" />Configuración General</h1>
        <p className="text-muted-foreground">
          Configurar ajustes y preferencias de la aplicación.
        </p>
      </div>

      {/* Notification Preferences Card */}
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

      {/* AI Preferences Card Removed */}
      
      {/* Customization Preferences Card */}
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
              Este nombre se mostrará en la cabecera y páginas de inicio de sesión/registro. (Cambiarlo dinámicamente en toda la app requiere integración adicional).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
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

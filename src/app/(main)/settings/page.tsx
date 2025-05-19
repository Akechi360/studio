
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Settings as SettingsIcon, Save, BellRing, Mail, MessageCircle } from 'lucide-react';

interface NotificationPreferences {
  emailOnNewTicket: boolean;
  emailOnNewComment: boolean;
}

export default function SettingsPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailOnNewTicket: true,
    emailOnNewComment: true,
  });

  useEffect(() => {
    const savedPrefs = localStorage.getItem('adminNotificationPrefs');
    if (savedPrefs) {
      setNotificationPrefs(JSON.parse(savedPrefs));
    }
  }, []);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    localStorage.setItem('adminNotificationPrefs', JSON.stringify(notificationPrefs));
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Configuración Guardada",
        description: "Tus preferencias de notificación han sido actualizadas.",
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
    <div className="space-y-8 max-w-3xl mx-auto">
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
              checked={notificationPrefs.emailOnNewTicket}
              onCheckedChange={(value) => handlePreferenceChange('emailOnNewTicket', value)}
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
              checked={notificationPrefs.emailOnNewComment}
              onCheckedChange={(value) => handlePreferenceChange('emailOnNewComment', value)}
              aria-label="Recibir correo para nuevos comentarios en mis tickets"
            />
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
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
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Más Opciones de Configuración</CardTitle>
            <CardDescription>Otras configuraciones de la aplicación aparecerán aquí a medida que se desarrollen.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mt-2 p-8 border border-dashed rounded-lg text-center">
                <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="font-semibold">Próximamente más configuraciones.</p>
                <p className="text-sm text-muted-foreground">Este es un buen lugar para ajustes de apariencia, integraciones, etc.</p>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}


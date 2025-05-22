
"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useForm as usePasswordForm } from "react-hook-form"; // alias useForm for password form
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/lib/auth-context';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, UserCircle2, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce una dirección de correo válida." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
  newPassword: z.string().min(6, { message: "La nueva contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La confirmación de contraseña debe tener al menos 6 caracteres." }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"], // Set error on confirmPassword field
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { user, updateProfile, updateSelfPassword, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const passwordForm = usePasswordForm<PasswordFormValues>({ // Use aliased hook
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, profileForm]);

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  async function onProfileSubmit(data: ProfileFormValues) {
    setIsSubmittingProfile(true);
    const success = await updateProfile(data.name, data.email);
    setIsSubmittingProfile(false);
    if (success) {
      toast({
        title: "Perfil Actualizado",
        description: "La información de tu perfil ha sido actualizada exitosamente.",
      });
    } else {
      toast({
        title: "Actualización Fallida",
        description: "No se pudo actualizar el perfil. El correo electrónico podría estar en uso.",
        variant: "destructive",
      });
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    setIsSubmittingPassword(true);
    const success = await updateSelfPassword(data.newPassword);
    setIsSubmittingPassword(false);
    if (success) {
      toast({
        title: "Contraseña Actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      });
      passwordForm.reset();
    } else {
      toast({
        title: "Fallo al Cambiar Contraseña",
        description: "No se pudo actualizar tu contraseña. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }
  
  if (authLoading && !user) {
      return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <div className="p-8">Por favor, inicia sesión para ver tu perfil.</div>;
  }

  return (
    <div> {/* Root container for the page content */}
      <div className="max-w-3xl mx-auto space-y-8"> {/* Centering and max-width container */}
        <div className="flex flex-col items-start"> {/* Title block */}
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <UserCircle2 className="mr-3 h-8 w-8 text-primary" />Tu Perfil
          </h1>
          <p className="text-muted-foreground">
            Gestiona la configuración de tu cuenta e información personal.
          </p>
        </div>

        <Card className="shadow-xl"> {/* Card 1: Profile Info */}
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
              <AvatarImage src={user.avatarUrl || `https://placehold.co/100x100.png?text=${getInitials(user.name)}`} alt={user.name || 'Usuario'} data-ai-hint="foto perfil"/>
              <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription>{user.role === "Admin" ? "Administrador" : "Usuario"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección de Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu.email@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="sm:w-auto" disabled={isSubmittingProfile || authLoading}>
                  {isSubmittingProfile ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar Cambios de Perfil
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-xl"> {/* Card 2: Password Change */}
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Lock className="mr-2 h-5 w-5 text-primary" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña de acceso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <Button type="submit" className="sm:w-auto" disabled={isSubmittingPassword || authLoading}>
                  {isSubmittingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Actualizar Contraseña
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div> {/* End of centering container */}
    </div>
  );
}

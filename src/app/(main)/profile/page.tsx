"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Loader2, Save, UserCircle2, Lock, LogOut, Pencil, KeyRound } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce una dirección de correo válida." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
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

  if (authLoading && !user) {
      return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <div className="p-8">Por favor, inicia sesión para ver tu perfil.</div>;
  }

  // Datos a mostrar
  const userData = [
    { label: "Nombre", value: user.name },
    { label: "Email", value: user.email },
    { label: "Rol", value: user.role === "Admin" ? "Administrador" : "Usuario" },
    { label: "Departamento", value: user.department || "-" },
  ];

  return (
    <div className="min-h-screen bg-background py-10">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center"><Pencil className="mr-2 h-6 w-6 text-primary" />Editar Perfil</DialogTitle>
            <DialogDescription>Modifica tu nombre y correo electrónico.</DialogDescription>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 py-2">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input className="rounded-lg" placeholder="Tu nombre completo" {...field} />
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
                      <Input className="rounded-lg" type="email" placeholder="tu.email@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" className="rounded-lg px-6 py-2 text-base font-semibold shadow-ammie" disabled={isSubmittingProfile || authLoading}>
                  {isSubmittingProfile ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna izquierda: Perfil y menú */}
        <div className="flex flex-col gap-6 md:col-span-1">
          {/* Card de perfil */}
          <div className="bg-card rounded-xl shadow-ammie p-8 flex flex-col items-center">
            <Avatar className="h-28 w-28 mb-4 ring-4 ring-primary ring-offset-4 ring-offset-card shadow-lg bg-background">
              <AvatarImage src={user.avatarUrl || `https://placehold.co/100x100.png?text=${getInitials(user.name)}`} alt={user.name || 'Usuario'} />
              <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="text-xl font-bold text-foreground mb-1">{user.name}</div>
            <div className="text-muted-foreground mb-2">{user.email}</div>
            {/* Fechas de creación y actualización */}
            <div className="mt-2 space-y-1 text-xs text-muted-foreground text-center">
              <p>
                <span className="font-medium text-foreground">Fecha de Creación:</span>{' '}
                {user.createdAt ? format(new Date(user.createdAt), "PPpp", { locale: es }) : 'N/A'}
              </p>
              <p>
                <span className="font-medium text-foreground">Última Actualización:</span>{' '}
                {user.updatedAt ? format(new Date(user.updatedAt), "PPpp", { locale: es }) : 'N/A'}
              </p>
            </div>
          </div>
          {/* Menú lateral */}
          <div className="bg-card rounded-xl shadow-ammie p-6">
            <ul className="space-y-3">
              <li className="flex items-center gap-2 font-semibold text-primary">
                <UserCircle2 className="h-5 w-5" />Mi Perfil
              </li>
              <li>
                <Button variant="outline" className="w-full flex items-center gap-2 justify-start text-foreground" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-5 w-5 text-primary" />Editar Perfil
                </Button>
              </li>
              <li>
                <Button variant="destructive" className="w-full flex items-center gap-2 justify-start" onClick={() => window.location.href = '/api/auth/logout'}>
                  <LogOut className="h-5 w-5" />Cerrar Sesión
                </Button>
              </li>
            </ul>
          </div>
        </div>
        {/* Columna derecha: Datos de usuario */}
        <div className="md:col-span-2">
          <div className="bg-card rounded-xl shadow-ammie p-8">
            <div className="text-2xl font-bold mb-6 text-foreground">Mi Perfil</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userData.map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="bg-muted/60 rounded-md px-3 py-2 font-semibold text-foreground text-base border border-border">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

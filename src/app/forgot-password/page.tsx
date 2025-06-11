"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/lib/auth-context';
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from '@/lib/constants';
import { KeyRound, Loader2, Hospital, ShieldQuestion } from 'lucide-react';

const forgotPasswordFormSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo válida." }),
  newPassword: z.string().min(6, { message: "La nueva contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "La confirmación de contraseña debe tener al menos 6 caracteres." }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export default function ForgotPasswordPage() {
  const { resetPasswordByEmail } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true);
    const result = await resetPasswordByEmail(data.email, data.newPassword);
    setIsLoading(false);
    if (result.success) {
      toast({
        title: "Contraseña Restablecida",
        description: result.message || "Tu contraseña ha sido actualizada exitosamente. Por favor, inicia sesión.",
      });
      form.reset();
      router.push("/login");
    } else {
      toast({
        title: "Fallo al Restablecer Contraseña",
        description: result.message || "No se pudo restablecer la contraseña. Verifica el correo e inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <img src="/bg-login.jpg" alt="Fondo IEQ" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-background/80 backdrop-blur-sm shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
               <ShieldQuestion className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold">Restablecer Contraseña</CardTitle>
            <CardDescription>Ingresa tu correo y tu nueva contraseña.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico Registrado</FormLabel>
                      <FormControl>
                        <Input placeholder="tu@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" showPasswordToggle {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" showPasswordToggle {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  Restablecer Contraseña
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2">
              <p className="text-sm text-muted-foreground">
                  ¿Recordaste tu contraseña?{" "}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                      Iniciar Sesión
                  </Link>
              </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

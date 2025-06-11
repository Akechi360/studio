"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
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
import { LogIn, Loader2, Hospital, Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const loginFormSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce una dirección de correo válida." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }), 
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme() ?? { theme: 'light', setTheme: () => {} };

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    const success = await login(data.email, data.password);
    setIsLoading(false);
    if (success) {
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "¡Bienvenido de nuevo!",
      });
      router.push("/dashboard");
    } else {
      toast({
        title: "Fallo en el Inicio de Sesión",
        description: "Correo electrónico o contraseña no válidos. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Fondo de imagen */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/bg-login.jpg"
          alt="Fondo IEQ"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      {/* Card principal */}
      <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm shadow-md relative">
        {mounted && typeof setTheme === 'function' && (
          <div className="absolute top-6 right-6 flex items-center space-x-2 text-foreground">
            <Label htmlFor="dark-mode-login-switch" className="text-sm font-medium">
              {theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
            </Label>
            <Switch
              id="dark-mode-login-switch"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        )}
        <CardHeader className="text-center pt-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Hospital className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">{APP_NAME}</CardTitle>
          <CardDescription>Tu Centro de Soluciones Administrativas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="tu@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>Contraseña</FormLabel>
                        <Link
                            href="/forgot-password"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            ¿Olvidó su contraseña?
                        </Link>
                    </div>
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
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Iniciar Sesión
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                    Regístrate
                </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from '@/lib/auth-context';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, ScreenShare, HelpCircle } from "lucide-react";
import { logAuditEvent, createTicketAction } from '@/lib/actions'; // Importar createTicketAction
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ANYDESK_SUPPORT_ID_EXAMPLE = "123456789";

const remoteAccessFormSchema = z.object({
  userAnyDeskId: z.string().min(9, { message: "El ID de AnyDesk debe tener al menos 9 dígitos." }).regex(/^\d+$/, { message: "El ID de AnyDesk solo debe contener números."}),
  reason: z.string().min(10, { message: "El motivo debe tener al menos 10 caracteres." }).max(500, { message: "El motivo no puede exceder los 500 caracteres." }),
});

type RemoteAccessFormValues = z.infer<typeof remoteAccessFormSchema>;

export default function RemoteAccessPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [submittedAnyDeskId, setSubmittedAnyDeskId] = useState("");

  const form = useForm<RemoteAccessFormValues>({
    resolver: zodResolver(remoteAccessFormSchema),
    defaultValues: {
      userAnyDeskId: "",
      reason: "",
    },
  });

  async function onSubmit(data: RemoteAccessFormValues) {
    if (!user || !user.email || !user.name) {
      toast({
        title: "Error de Autenticación",
        description: "Debes iniciar sesión para solicitar acceso remoto.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Registrar evento de auditoría
      await logAuditEvent(user.email, "Solicitud de Acceso Remoto Iniciada", `ID AnyDesk: ${data.userAnyDeskId}, Motivo: ${data.reason}`);
      
      // 2. Crear el ticket de soporte
      const ticketSubject = `Solicitud de Acceso Remoto - ${user.name}`;
      const ticketDescription = `
Usuario: ${user.name} (${user.email})
ID de AnyDesk del Usuario: ${data.userAnyDeskId}
Motivo de la Solicitud:
${data.reason}

Por favor, contactar al usuario para establecer la conexión remota.
      `.trim();

      const ticketResult = await createTicketAction(user.id, user.name, {
        subject: ticketSubject,
        description: ticketDescription,
        priority: "Medium", // O la prioridad que consideres adecuada
        userEmail: user.email,
      });

      if (ticketResult.success && ticketResult.ticketId) {
        toast({
          title: "Solicitud Enviada y Ticket Creado",
          description: `Tu solicitud de acceso remoto ha sido registrada (Ticket #${ticketResult.displayId}). Un técnico se pondrá en contacto.`,
        });
        setSubmittedAnyDeskId(data.userAnyDeskId);
        setRequestSent(true);
        form.reset();
      } else {
        toast({
          title: "Error al Crear Ticket",
          description: ticketResult.message || "No se pudo crear el ticket para tu solicitud de acceso remoto.",
          variant: "destructive",
        });
        // Opcional: revertir auditoría si la creación del ticket falla, o loguear el fallo.
        await logAuditEvent(user.email, "Fallo en Solicitud de Acceso Remoto", `No se pudo crear el ticket. ID AnyDesk: ${data.userAnyDeskId}`);
      }
    } catch (error) {
      console.error("Error al procesar solicitud de acceso remoto:", error);
      toast({
        title: "Error Inesperado",
        description: "No se pudo procesar tu solicitud. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (requestSent) {
    return (
      <div className="space-y-8 w-full">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ScreenShare className="mr-3 h-7 w-7 text-primary" />
              Solicitud de Acceso Remoto Enviada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-900/30">
              <HelpCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-400">¡Solicitud Recibida!</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-300">
                Hemos recibido tu solicitud de acceso remoto y se ha creado un ticket de soporte.
                Un técnico se pondrá en contacto contigo pronto.
                <br /><br />
                <strong>Por favor, asegúrate de tener AnyDesk abierto con el ID <span className="font-semibold">{submittedAnyDeskId}</span> y estar atento a las solicitudes de conexión.</strong>
                <br />
                Si necesitas iniciar una conexión a un ID de soporte específico (ej: {ANYDESK_SUPPORT_ID_EXAMPLE}), puedes hacerlo directamente desde tu aplicación AnyDesk.
              </AlertDescription>
            </Alert>
            <Button onClick={() => setRequestSent(false)} className="mt-6">
              Realizar otra solicitud
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-8 w-full">
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <ScreenShare className="mr-3 h-7 w-7 text-primary" />
            Solicitar Acceso Remoto
          </CardTitle>
          <CardDescription>
            Completa el siguiente formulario para solicitar asistencia remota. Un técnico se conectará a tu equipo utilizando el ID de AnyDesk que proporciones. Al enviar, se creará un ticket de soporte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="mb-6 bg-primary/5 border-primary/30">
            <HelpCircle className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary">¿Cómo funciona?</AlertTitle>
            <AlertDescription>
              1. Ingresa tu ID de AnyDesk (lo encuentras en tu aplicación AnyDesk en "Este puesto de trabajo").
              <br />
              2. Describe brevemente el motivo de tu solicitud.
              <br />
              3. Envía la solicitud. Se creará un ticket y un técnico revisará tu caso para conectarse. Mantén AnyDesk abierto.
            </AlertDescription>
          </Alert>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="userAnyDeskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu ID de AnyDesk *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 123456789" {...field} />
                    </FormControl>
                    <FormDescription>
                      El ID numérico que aparece en tu aplicación AnyDesk.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo de la Solicitud *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe brevemente el problema o la asistencia que necesitas..."
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar Solicitud y Crear Ticket
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Al enviar esta solicitud, se creará un ticket de soporte y aceptas que un técnico se conecte remotamente a tu equipo para asistirte.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}


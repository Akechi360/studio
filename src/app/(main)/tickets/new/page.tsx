
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TicketForm, type TicketFormValues } from '@/components/tickets/ticket-form';
import { createTicketAction } from '@/lib/actions';
import { useAuth } from '@/lib/auth-context';
import { useToast } from "@/hooks/use-toast";

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: TicketFormValues) => {
    if (!user) {
      toast({
        title: "Error de Autenticación",
        description: "Debes iniciar sesión para crear un ticket.",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert priority back to English if necessary for the backend, or handle in backend
      // For now, assuming backend handles Spanish priority strings if constants are Spanish
      const result = await createTicketAction(user.id, user.name, data);
      if (result.success && result.ticketId) {
        toast({
          title: "¡Ticket Creado!",
          description: result.message,
        });
        router.push(`/tickets/${result.ticketId}`);
      } else {
        toast({
          title: "Fallo al Crear Ticket",
          description: result.message || "Ocurrió un error desconocido.",
          variant: "destructive",
        });
        if (result.errors) {
          console.error("Errores de validación:", result.errors);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al crear el ticket.",
        variant: "destructive",
      });
      console.error("Error al crear ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <TicketForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}

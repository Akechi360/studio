
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
    if (!user || !user.email) { // Ensure user and user.email exist
      toast({
        title: "Error de Autenticación",
        description: "Debes iniciar sesión y tener un correo electrónico configurado para crear un ticket.",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass user.email to the action
      const result = await createTicketAction(user.id, user.name, { ...data, userEmail: user.email });
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
    <div className="space-y-8">
      <TicketForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}

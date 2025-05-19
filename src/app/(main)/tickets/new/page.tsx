
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
        title: "Authentication Error",
        description: "You must be logged in to create a ticket.",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTicketAction(user.id, user.name, data);
      if (result.success && result.ticketId) {
        toast({
          title: "Ticket Created!",
          description: result.message,
        });
        router.push(`/tickets/${result.ticketId}`);
      } else {
        toast({
          title: "Failed to Create Ticket",
          description: result.message || "An unknown error occurred.",
          variant: "destructive",
        });
        // Handle field errors if `result.errors` exists
        if (result.errors) {
          console.error("Validation errors:", result.errors);
          // You could potentially map these errors to form fields if needed
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the ticket.",
        variant: "destructive",
      });
      console.error("Ticket creation error:", error);
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

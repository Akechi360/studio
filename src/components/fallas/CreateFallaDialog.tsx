
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createFallaAction } from '@/lib/actions';
import type { User, FallaPriority } from '@/lib/types';
import { FALLA_PRIORITIES } from '@/lib/types';
import { Loader2, Wrench, Send } from 'lucide-react';

const createFallaFormSchema = z.object({
  subject: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres." }).max(150, { message: "Máximo 150 caracteres."}),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }).max(2000, { message: "Máximo 2000 caracteres."}),
  location: z.string().min(3, { message: "La ubicación debe tener al menos 3 caracteres." }).max(100, { message: "Máximo 100 caracteres."}),
  equipment: z.string().max(100, { message: "Máximo 100 caracteres."}).optional(),
  priority: z.enum(FALLA_PRIORITIES as [FallaPriority, ...FallaPriority[]], { required_error: "La prioridad es obligatoria."}),
});

export type CreateFallaFormValues = z.infer<typeof createFallaFormSchema>;

interface CreateFallaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: User;
}

export function CreateFallaDialog({ isOpen, onClose, onSuccess, currentUser }: CreateFallaDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateFallaFormValues>({
    resolver: zodResolver(createFallaFormSchema),
    defaultValues: {
      subject: "",
      description: "",
      location: "",
      equipment: "",
      priority: "Media",
    },
  });

  const onSubmit = async (data: CreateFallaFormValues) => {
    setIsSubmitting(true);
    const result = await createFallaAction({
        ...data,
        reportedByUserId: currentUser.id,
        reportedByUserName: currentUser.name,
        // Default assignment can be handled server-side or passed here
        // For now, let server action assign Emilia by default
    });
    setIsSubmitting(false);

    if (result.success && result.fallaId) {
      toast({
        title: "Falla Reportada",
        description: result.message || "La falla ha sido reportada exitosamente.",
      });
      form.reset();
      onSuccess();
    } else {
      toast({
        title: "Error al Reportar Falla",
        description: result.message || "No se pudo reportar la falla.",
        variant: "destructive",
      });
       if (result.errors) {
        Object.entries(result.errors).forEach(([fieldName, errors]) => {
          if (errors && errors.length > 0) {
            form.setError(fieldName as keyof CreateFallaFormValues, {
              type: 'server',
              message: (errors as string[]).join(', '),
            });
          }
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); form.reset(); } }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wrench className="mr-2 h-6 w-6 text-primary" />
            Reportar Nueva Falla Técnica
          </DialogTitle>
          <DialogDescription>
            Completa los detalles de la falla. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asunto / Título Corto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Ventilador UCI no enciende" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción Detallada *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe el problema, síntomas, cuándo ocurrió, etc." className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación de la Falla *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Quirófano 2, Habitación 305, Oficina de Admisión" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipo Afectado (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Ventilador Dräger X500, Monitor HP EliteDisplay" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FALLA_PRIORITIES.map((prio) => (
                        <SelectItem key={prio} value={prio}>{prio}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => { onClose(); form.reset(); }}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Reportar Falla
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

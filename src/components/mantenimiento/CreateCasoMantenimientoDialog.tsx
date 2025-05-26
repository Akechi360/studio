
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod"; // Ensure z is imported
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
import { createCasoMantenimientoAction } from '@/lib/actions';
import type { User, CasoMantenimientoPriority, CasoMantenimientoStatus } from '@/lib/types'; // Ensure types are imported
import { CASO_PRIORITIES } from '@/lib/types'; // Import CASO_PRIORITIES
import { CreateCasoMantenimientoFormSchema } from '@/lib/schemas'; // Import from new schemas file
import { Loader2, PlusCircle, Save, Wrench } from 'lucide-react';

export type CreateCasoMantenimientoFormValues = z.infer<typeof CreateCasoMantenimientoFormSchema>;

interface CreateCasoMantenimientoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCasoCreated: () => void;
  currentUser: User | null;
}

export function CreateCasoMantenimientoDialog({ isOpen, onClose, onCasoCreated, currentUser }: CreateCasoMantenimientoDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateCasoMantenimientoFormValues>({
    resolver: zodResolver(CreateCasoMantenimientoFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      equipment: "",
      priority: "Media",
      assignedProviderName: "",
    },
  });

  const onSubmit = async (data: CreateCasoMantenimientoFormValues) => {
    if (!currentUser || !currentUser.id || !currentUser.name || !currentUser.email) {
      toast({ title: "Error de Autenticación", description: "No se pudo identificar al usuario actual.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await createCasoMantenimientoAction(data, currentUser.id, currentUser.name, currentUser.email);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Caso de Mantenimiento Registrado",
        description: result.message,
      });
      form.reset();
      onCasoCreated();
    } else {
      toast({
        title: "Fallo al Registrar Caso",
        description: result.message || "Ocurrió un error desconocido.",
        variant: "destructive",
      });
      if (result.errors) {
        Object.entries(result.errors).forEach(([fieldName, errors]) => {
          if (errors && errors.length > 0) {
            form.setError(fieldName as keyof CreateCasoMantenimientoFormValues, {
              type: 'server',
              message: (errors as string[]).join(', '),
            });
          }
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { form.reset(); onClose();} }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wrench className="mr-2 h-6 w-6 text-primary" />
            Registrar Nuevo Caso de Mantenimiento
          </DialogTitle>
          <DialogDescription>
            Completa los detalles del nuevo caso de mantenimiento. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del Caso *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Falla en Aire Acondicionado Central" {...field} />
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
                  <FormLabel>Descripción de la Incidencia *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalla el problema o el mantenimiento requerido..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Quirófano 1, Sala de Espera UCI" {...field} />
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
                      <Input placeholder="Ej: Ventilador Dräger X2000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                      {CASO_PRIORITIES.map((prio) => (
                        <SelectItem key={prio} value={prio}>{prio}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignedProviderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor Asignado *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la empresa proveedora" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => { form.reset(); onClose();}}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Caso
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

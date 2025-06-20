"use client";

import React from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TICKET_PRIORITIES, TICKET_PRIORITIES_ENGLISH, TICKET_CATEGORIES_ENGLISH } from "@/lib/constants";
import type { TicketPriority } from "@/lib/types";
import { Loader2, Send } from "lucide-react";

// Opciones de departamentos
const DEPARTAMENTOS = [
  "Electromedicina",
  "Sistemas",
  "Mantenimiento",
  "Desarrollo (Vinicio)",
];

const ticketFormSchema = z.object({
  subject: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres." }).max(100, { message: "El asunto debe tener como máximo 100 caracteres." }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }).max(2000, { message: "La descripción debe tener como máximo 2000 caracteres." }),
  priority: z.enum(TICKET_PRIORITIES_ENGLISH as [TicketPriority, ...TicketPriority[]], { // Keep Zod enum with English values for backend
    required_error: "Necesitas seleccionar una prioridad para el ticket.",
  }),
  category: z.enum(TICKET_CATEGORIES_ENGLISH as [string, ...string[]], {
    required_error: "Necesitas seleccionar una categoría para el ticket.",
  }),
  departamento: z.string().min(1, { message: "Debes seleccionar un departamento." }),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  onSubmit: (data: TicketFormValues) => Promise<void>;
  defaultValues?: Partial<TicketFormValues>;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

export function TicketForm({ 
  onSubmit, 
  defaultValues,
  isSubmitting = false,
  submitButtonText = "Enviar Ticket"
}: TicketFormProps) {
  
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      subject: defaultValues?.subject || "",
      description: defaultValues?.description || "",
      priority: defaultValues?.priority || "Medium",
      category: defaultValues?.category || "Other",
      departamento: defaultValues?.departamento || "",
    },
  });

  const priorityMap = {
    "Low": "Baja",
    "Medium": "Media",
    "High": "Alta"
  };

  const categoryMap: Record<string, string> = {
    HardwareIssue: 'Problemas de Hardware',
    SoftwareIssue: 'Problemas de Software',
    NetworkIssue: 'Problemas de Red',
    AppAccess: 'Acceso a Aplicaciones',
    InfoRequest: 'Solicitudes de Información',
    EquipmentMaintenance: 'Mantenimiento de Equipos',
    PrintingIssue: 'Problemas de Impresión',
    EmailIssue: 'Problemas de Correo Electrónico',
    Other: 'Otros',
  };


  return (
    <Card className="shadow-xl"> {/* Removed w-full */}
      <CardHeader>
        <CardTitle className="text-2xl">Crear un Nuevo Ticket de Soporte</CardTitle>
        <CardDescription>Por favor, completa el siguiente formulario para enviar tu solicitud de soporte. Proporciona tantos detalles como sea posible.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: No puedo iniciar sesión" {...field} />
                  </FormControl>
                  <FormDescription>
                    Un breve resumen de tu problema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Por favor, describe tu problema en detalle..."
                      className="min-h-[150px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Incluye pasos para reproducir, mensajes de error y cualquier otra información relevante.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent side="bottom">
                      {DEPARTAMENTOS.map((departamento) => (
                        <SelectItem key={departamento} value={departamento}>
                          {departamento}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecciona el departamento al que va dirigido este ticket.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la prioridad del ticket" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent side="bottom">
                      {TICKET_PRIORITIES_ENGLISH.map((priorityKey) => (
                        <SelectItem key={priorityKey} value={priorityKey}>
                          {priorityMap[priorityKey]} 
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    ¿Qué tan urgente es este problema?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'Other'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent side="bottom">
                      {TICKET_CATEGORIES_ENGLISH.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryMap[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              {submitButtonText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createApprovalRequestAction } from '@/lib/actions';
import type { ApprovalRequestType } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Send, CreditCard } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";


const paymentRequestFormSchema = z.object({
  asunto: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres." }).max(100, { message: "Máximo 100 caracteres." }),
  proveedor: z.string().min(3, { message: "El proveedor debe tener al menos 3 caracteres." }).max(100, { message: "Máximo 100 caracteres." }),
  montoTotal: z.coerce.number({ invalid_type_error: "Debe ser un número." }).positive({ message: "El monto debe ser positivo." }),
  fechaRequerida: z.date({
    required_error: "La fecha requerida es obligatoria.",
    invalid_type_error: "Formato de fecha inválido.",
  }).optional(),
  descripcion: z.string().max(2000, { message: "Máximo 2000 caracteres." }).optional(),
});

type PaymentRequestFormValues = z.infer<typeof paymentRequestFormSchema>;

interface CreatePaymentRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (approvalId: string) => void;
}

export function CreatePaymentRequestDialog({ isOpen, onClose, onSuccess }: CreatePaymentRequestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentRequestFormValues>({
    resolver: zodResolver(paymentRequestFormSchema),
    defaultValues: {
      asunto: "",
      proveedor: "",
      montoTotal: undefined,
      fechaRequerida: undefined,
      descripcion: "",
    },
  });

  const onSubmit = async (data: PaymentRequestFormValues) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Debes iniciar sesión.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const requestData = {
      type: "PagoProveedor" as ApprovalRequestType,
      subject: data.asunto,
      description: data.descripcion,
      requesterId: user.id,
      requesterName: user.name,
      requesterEmail: user.email,
      supplierPago: data.proveedor,
      totalAmountToPay: data.montoTotal,
      paymentDueDate: data.fechaRequerida,
    };

    const result = await createApprovalRequestAction(requestData);
    setIsSubmitting(false);

    if (result.success && result.approvalId) {
      toast({
        title: "Solicitud de Pago Enviada",
        description: result.message,
      });
      form.reset();
      if (onSuccess) onSuccess(result.approvalId);
      onClose();
    } else {
      toast({
        title: "Fallo al Enviar Solicitud",
        description: result.message || "Ocurrió un error desconocido.",
        variant: "destructive",
      });
      if (result.errors) {
        console.error("Errores de validación del servidor:", result.errors);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Nueva Solicitud de Pago a Proveedores
          </DialogTitle>
          <DialogDescription>
            Completa los detalles para tu solicitud de pago. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="asunto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asunto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Pago factura #123 servicio de limpieza" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="proveedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Limpiezas El Sol C.A." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="montoTotal"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Monto Total a Pagar *</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Ej: 350.75" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="fechaRequerida"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel className="mb-1.5">Fecha Requerida (Opcional)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP", { locale: es })
                                    ) : (
                                        <span>Selecciona una fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                    date < new Date(new Date().setDate(new Date().getDate() -1)) // Disable past dates
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción / Justificación Adicional</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Cualquier detalle adicional sobre el pago..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
                <FormLabel>Archivos Adjuntos (Opcional)</FormLabel>
                <FormControl>
                    <Input type="file" multiple accept="application/pdf" disabled /> 
                </FormControl>
                <FormDescription>
                    (Funcionalidad de carga de archivos en desarrollo. Máx. 5 PDF, 50MB total).
                </FormDescription>
            </FormItem>

            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar Solicitud
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

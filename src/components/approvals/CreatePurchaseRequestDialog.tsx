
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
import { Loader2, Send, ShoppingCart } from 'lucide-react';

const purchaseRequestFormSchema = z.object({
  asunto: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres." }).max(100, { message: "Máximo 100 caracteres." }),
  item: z.string().min(3, { message: "El ítem debe tener al menos 3 caracteres." }).max(200, { message: "Máximo 200 caracteres." }),
  descripcion: z.string().max(2000, { message: "Máximo 2000 caracteres." }).optional(),
  precioEstimado: z.coerce.number({ invalid_type_error: "Debe ser un número." }).positive({ message: "El precio debe ser positivo." }).optional(),
  proveedor: z.string().max(100, { message: "Máximo 100 caracteres." }).optional(),
  // attachments field would be here, but complex to handle fully without backend
});

type PurchaseRequestFormValues = z.infer<typeof purchaseRequestFormSchema>;

interface CreatePurchaseRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (approvalId: string) => void;
}

export function CreatePurchaseRequestDialog({ isOpen, onClose, onSuccess }: CreatePurchaseRequestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestFormSchema),
    defaultValues: {
      asunto: "",
      item: "",
      descripcion: "",
      precioEstimado: undefined,
      proveedor: "",
    },
  });

  const onSubmit = async (data: PurchaseRequestFormValues) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Debes iniciar sesión.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const requestData = {
      type: "Compra" as ApprovalRequestType,
      subject: data.asunto,
      description: data.descripcion,
      requesterId: user.id,
      requesterName: user.name,
      requesterEmail: user.email,
      itemDescription: data.item,
      estimatedPrice: data.precioEstimado,
      supplierCompra: data.proveedor,
    };

    const result = await createApprovalRequestAction(requestData);
    setIsSubmitting(false);

    if (result.success && result.approvalId) {
      toast({
        title: "Solicitud de Compra Enviada",
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
        // You could map these errors to form fields if needed
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-6 w-6 text-primary" />
            Nueva Solicitud de Compra
          </DialogTitle>
          <DialogDescription>
            Completa los detalles para tu solicitud de compra. Los campos marcados con * son obligatorios.
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
                    <Input placeholder="Ej: Compra de monitores para diseño" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ítem(s) a Comprar *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 2 Monitores Dell 27 pulgadas 4K" {...field} />
                  </FormControl>
                   <FormDescription>Describe brevemente qué necesitas comprar.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción / Justificación</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Explica el motivo de la compra, uso, etc." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="precioEstimado"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Precio Est. Completo (Opcional)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Ej: 750.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                    <FormLabel>Proveedor Sugerido (Opcional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: TechGlobal S.A." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

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

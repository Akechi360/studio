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
import { Loader2, Send, CreditCard, Paperclip, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createApprovalRequestAction } from '@/lib/actions';
import type { ApprovalRequestType, AttachmentClientData } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

const paymentRequestFormSchema = z.object({
  asunto: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres." }).max(100, { message: "Máximo 100 caracteres." }),
  proveedor: z.string().min(3, { message: "El proveedor debe tener al menos 3 caracteres." }).max(100, { message: "Máximo 100 caracteres." }),
  montoTotal: z.coerce.number({invalid_type_error: "Debe ser un número."}).positive({ message: "El monto total debe ser positivo." }),
  descripcion: z.string().min(10, {message: "Por favor, incluye la fecha requerida de pago en la descripción."}).max(2000, { message: "Máximo 2000 caracteres." }).optional(),
  attachmentsData: z.array(z.object({
    fileName: z.string(),
    size: z.number(),
    type: z.string().optional(),
  })).optional(),
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<PaymentRequestFormValues>({
    resolver: zodResolver(paymentRequestFormSchema),
    defaultValues: {
      asunto: "",
      proveedor: "",
      montoTotal: "" as unknown as number,
      descripcion: "",
      attachmentsData: [],
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const allFiles = [...selectedFiles, ...newFiles];

      if (allFiles.length > 5) {
        toast({ title: "Límite de archivos excedido", description: "Puedes adjuntar un máximo de 5 archivos PDF.", variant: "destructive" });
        return;
      }

      const nonPdfFiles = newFiles.filter(file => file.type !== "application/pdf");
      if (nonPdfFiles.length > 0) {
        toast({ title: "Tipo de archivo no válido", description: "Solo se permiten archivos PDF.", variant: "destructive" });
        return;
      }
      
      const totalSize = allFiles.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 50 * 1024 * 1024) { // 50MB
         toast({ title: "Tamaño total excedido", description: "El tamaño total de los archivos no debe exceder los 50MB.", variant: "destructive" });
         return;
      }

      setSelectedFiles(allFiles.slice(0, 5));
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
    }
  };
  
  const handleDialogClose = () => {
    form.reset();
    setSelectedFiles([]);
    onClose();
  };

  const onSubmit = async (data: PaymentRequestFormValues) => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Debes iniciar sesión.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const attachmentsData: AttachmentClientData[] = selectedFiles.map(file => ({
      fileName: file.name,
      size: file.size,
      type: file.type,
    }));

    const requestData = {
      type: "PagoProveedor" as const,
      subject: data.asunto,
      description: data.descripcion,
      requesterId: user.id,
      requesterName: user.name,
      requesterEmail: user.email,
      supplierPago: data.proveedor,
      totalAmountToPay: data.montoTotal,
      attachmentsData: attachmentsData,
    };

    const result = await createApprovalRequestAction(requestData);
    setIsSubmitting(false);

    if (result.success && result.approvalId) {
      toast({
        title: "Solicitud de Pago Enviada",
        description: result.message,
      });
      if (onSuccess) onSuccess(result.approvalId);
      handleDialogClose();
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Nueva Solicitud de Pago a Proveedores
          </DialogTitle>
          <DialogDescription>
            Completa los detalles para tu solicitud de pago. Los campos marcados con * son obligatorios.
            <br />
            <span className="font-semibold text-primary">Importante:</span> Por favor, especifica la fecha requerida de pago dentro del campo "Descripción Adicional".
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
                    <Input placeholder="Ej: Pago Factura #123 Electricidad" {...field} />
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
                    <Input placeholder="Ej: Corpoelec C.A." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="montoTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto Total a Pagar *</FormLabel>
                  <FormControl>
                     <Input type="number" placeholder="Ej: 150.75" {...field} value={field.value === undefined ? "" : field.value} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción Adicional (Incluir Fecha Requerida de Pago aquí) *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Cualquier detalle relevante sobre el pago, y la fecha en que se requiere..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
                <FormLabel className="flex items-center"><Paperclip className="mr-2 h-4 w-4"/>Archivos Adjuntos (PDF, máx. 5)</FormLabel>
                <FormControl>
                    <Input 
                        type="file" 
                        multiple 
                        accept="application/pdf" 
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    /> 
                </FormControl>
                {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                        <p className="text-sm font-medium">Archivos seleccionados:</p>
                        <ul className="list-disc list-inside space-y-1">
                        {selectedFiles.map(file => (
                            <li key={file.name} className="text-sm flex items-center justify-between">
                                <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(file.name)} className="h-6 w-6 text-destructive">
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                        </ul>
                    </div>
                )}
                <FormDescription>
                    Máximo 5 archivos PDF. Tamaño total no debe exceder 50MB.
                </FormDescription>
            </FormItem>
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
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

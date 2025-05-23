
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
import type { ApprovalRequestType, AttachmentClientData } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Send, ShoppingCart, Paperclip, XCircle } from 'lucide-react';

const purchaseRequestFormSchema = z.object({
  asunto: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres." }).max(100, { message: "Máximo 100 caracteres." }),
  item: z.string().min(3, { message: "El ítem debe tener al menos 3 caracteres." }).max(200, { message: "Máximo 200 caracteres." }),
  descripcion: z.string().max(2000, { message: "Máximo 2000 caracteres." }).optional(),
  precioEstimado: z.coerce.number({ invalid_type_error: "Debe ser un número." }).positive({ message: "El precio debe ser positivo." }).optional(),
  proveedor: z.string().max(100, { message: "Máximo 100 caracteres." }).optional(),
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      
      // Simplified total size check (more robust check ideally on server)
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
        fileInputRef.current.value = ""; // Reset file input to allow re-selection of the same file
    }
  };


  const onSubmit = async (data: PurchaseRequestFormValues) => {
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
      type: "Compra" as ApprovalRequestType,
      subject: data.asunto,
      description: data.descripcion,
      requesterId: user.id,
      requesterName: user.name,
      requesterEmail: user.email,
      itemDescription: data.item,
      estimatedPrice: data.precioEstimado,
      supplierCompra: data.proveedor,
      attachmentsData: attachmentsData,
    };

    const result = await createApprovalRequestAction(requestData);
    setIsSubmitting(false);

    if (result.success && result.approvalId) {
      toast({
        title: "Solicitud de Compra Enviada",
        description: result.message,
      });
      form.reset();
      setSelectedFiles([]);
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); form.reset(); setSelectedFiles([]);} }}>
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
                <Button type="button" variant="outline" onClick={() => { onClose(); form.reset(); setSelectedFiles([]); }}>
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

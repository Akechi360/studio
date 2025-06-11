"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useAuth } from '@/lib/auth-context';
import { crearFalla } from '@/lib/fallas/actions';
import { SeveridadFalla, TipoFalla } from "@prisma/client";
import { Bug, Loader2, Save } from 'lucide-react';

const CreateFallaFormSchema = z.object({
  titulo: z.string().min(5, { message: "El título debe tener al menos 5 caracteres." }).max(150),
  descripcion: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }).max(2000),
  equipoNombre: z.string().min(2, { message: "El equipo es obligatorio." }),
  equipoUbicacion: z.string().min(2, { message: "La ubicación del equipo es obligatoria." }),
  ubicacion: z.string().min(2, { message: "La ubicación es obligatoria." }),
  severidad: z.nativeEnum(SeveridadFalla),
  tipoFalla: z.nativeEnum(TipoFalla),
  impacto: z.string().optional(),
  adjuntos: z.any().optional(),
});

type CreateFallaFormValues = z.infer<typeof CreateFallaFormSchema>;

interface CreateFallaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFallaCreated?: () => void;
}

export function CreateFallaDialog({ isOpen, onClose, onFallaCreated }: CreateFallaDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjuntos, setAdjuntos] = useState<File[]>([]);

  const form = useForm<CreateFallaFormValues>({
    resolver: zodResolver(CreateFallaFormSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      equipoNombre: "",
      equipoUbicacion: "",
      ubicacion: "",
      severidad: "MEDIA",
      tipoFalla: "OTRO",
      impacto: "",
    },
  });

  const onSubmit = async (data: CreateFallaFormValues) => {
    if (!user || !user.id) {
      setError("No se pudo identificar al usuario actual.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await crearFalla({ ...data, adjuntos }, user.id);
      form.reset();
      if (onFallaCreated) onFallaCreated();
      onClose();
    } catch (e: any) {
      setError(e.message || "Error al reportar la falla");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { form.reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bug className="mr-2 h-6 w-6 text-primary" />
            Reportar Nueva Falla
          </DialogTitle>
          <DialogDescription>
            Completa los detalles para reportar una nueva falla. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título de la Falla *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Falla en Bomba de Infusión" {...field} />
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
                  <FormLabel>Descripción del Problema *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalla el problema presentado, síntomas, etc." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="equipoNombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo Afectado *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Monitor Mindray VS800" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="equipoUbicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación del Equipo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Sala de Emergencias, UCI, Quirófano 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ubicacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Quirófano 2, UCI, Laboratorio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="severidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severidad *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una severidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(SeveridadFalla).map((sev) => (
                          <SelectItem key={sev} value={sev}>{sev}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipoFalla"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Falla *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TipoFalla).map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="impacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impacto en el Paciente/Servicio (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Interrupción de monitoreo, retraso en atención, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <label className="block font-medium">Adjuntos (fotos, videos, docs)</label>
              <input type="file" multiple onChange={e => setAdjuntos(Array.from(e.target.files || []))} />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => { form.reset(); onClose(); }}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Reportar Falla
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// This file is intentionally left empty to signify its deletion as part of module removal.
// The build system or manual cleanup should remove this file if it's no longer referenced.

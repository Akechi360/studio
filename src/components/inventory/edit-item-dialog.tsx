"use client";

import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateInventoryItemAction } from '@/lib/actions';
import type { InventoryItem, InventoryItemCategory, InventoryItemStatus, StorageType, User } from '@/lib/types'; // Added User
import { INVENTORY_ITEM_CATEGORIES, INVENTORY_ITEM_STATUSES } from '@/lib/types';
import { Loader2, Save, Edit3 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context'; // Import useAuth

const RAM_OPTIONS = ["NoEspecificado", "RAM_2GB", "RAM_4GB", "RAM_8GB", "RAM_12GB", "RAM_16GB", "RAM_32GB", "RAM_64GB", "Otro"] as const;
const STORAGE_TYPES_WITH_NONE = ["NoEspecificado", "HDD", "SSD"] as const;
const STORAGE_TYPES_ZOD_ENUM = ["HDD", "SSD"] as [StorageType, ...StorageType[]];

const inventoryItemEditFormSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }).max(100, { message: "Máximo 100 caracteres."}),
  category: z.enum(INVENTORY_ITEM_CATEGORIES, { required_error: "La categoría es obligatoria."}),
  brand: z.string().max(50, { message: "Máximo 50 caracteres."}).optional(),
  model: z.string().max(50, { message: "Máximo 50 caracteres."}).optional(),
  serialNumber: z.string().max(100, { message: "Máximo 100 caracteres."}).optional(),
  processor: z.string().max(100, { message: "Máximo 100 caracteres."}).optional(),
  ram: z.enum(RAM_OPTIONS).optional(),
  storageType: z.enum(STORAGE_TYPES_ZOD_ENUM).optional(),
  storage: z.string().max(50, { message: "Máximo 50 caracteres."}).optional(),
  quantity: z.coerce.number({invalid_type_error: "Debe ser un número."}).int("Debe ser un entero.").min(1, { message: "La cantidad debe ser al menos 1." }),
  location: z.string().max(100, { message: "Máximo 100 caracteres."}).optional(),
  status: z.enum(INVENTORY_ITEM_STATUSES, { required_error: "El estado es obligatorio."}),
  notes: z.string().max(500, { message: "Máximo 500 caracteres."}).optional(),
});

export type InventoryItemEditFormValues = z.infer<typeof inventoryItemEditFormSchema>;

interface EditItemDialogProps {
  itemToEdit: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: () => void;
}

export function EditItemDialog({ itemToEdit, isOpen, onClose, onItemUpdated }: EditItemDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth(); // Get current user for auditing
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InventoryItemEditFormValues>({
    resolver: zodResolver(inventoryItemEditFormSchema),
    defaultValues: {
      name: "",
      category: undefined,
      brand: "",
      model: "",
      serialNumber: "",
      processor: "",
      ram: "NoEspecificado",
      storageType: undefined,
      storage: "",
      quantity: 1,
      location: "",
      status: "EnUso",
      notes: "",
    },
  });

  useEffect(() => {
    if (itemToEdit) {
      form.reset({
        name: itemToEdit.name,
        category: itemToEdit.category,
        brand: itemToEdit.brand || "",
        model: itemToEdit.model || "",
        serialNumber: itemToEdit.serialNumber || "",
        processor: itemToEdit.processor || "",
        ram: (itemToEdit.ram as typeof RAM_OPTIONS[number]) || "NoEspecificado",
        storageType: itemToEdit.storageType || undefined,
        storage: itemToEdit.storage || "",
        quantity: itemToEdit.quantity,
        location: itemToEdit.location || "",
        status: itemToEdit.status,
        notes: itemToEdit.notes || "",
      });
    }
  }, [itemToEdit, form]);

  const watchedCategory = form.watch("category");

  useEffect(() => {
    if (watchedCategory !== "Computadora") {
      form.setValue("ram", "NoEspecificado");
      form.setValue("storageType", undefined);
      form.setValue("storage", "");
      form.setValue("processor", "");
    }
  }, [watchedCategory, form, itemToEdit]);

  if (!itemToEdit) return null;

  const onSubmit = async (data: InventoryItemEditFormValues) => {
    if (!currentUser || !currentUser.email) {
      toast({ title: "Error de Autenticación", description: "Debes iniciar sesión y tener un email configurado para actualizar.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    let dataToSend: Partial<InventoryItemEditFormValues> = { ...data };
    
    if (data.category === "Computadora") {
        dataToSend.ram = data.ram === "NoEspecificado" ? undefined : data.ram;
        dataToSend.storageType = data.storageType;
        dataToSend.storage = data.storage;
        dataToSend.processor = data.processor;
    } else {
        dataToSend.ram = undefined;
        dataToSend.storageType = undefined;
        dataToSend.storage = undefined;
        dataToSend.processor = undefined;
    }

    const result = await updateInventoryItemAction(itemToEdit.id, currentUser.email, dataToSend as InventoryItemEditFormValues);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Artículo Actualizado",
        description: result.message,
      });
      onItemUpdated();
      onClose();
    } else {
      toast({
        title: "Fallo al Actualizar Artículo",
        description: result.message || "Ocurrió un error desconocido.",
        variant: "destructive",
      });
      if (result.errors) {
        Object.entries(result.errors).forEach(([fieldName, errors]) => {
          if (errors && Array.isArray(errors) && errors.length > 0) {
            form.setError(fieldName as keyof InventoryItemEditFormValues, {
              type: 'server',
              message: errors.join(', '),
            });
          }
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-6 w-6 text-primary" />
            Editar Artículo del Inventario: {itemToEdit.name}
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles del artículo. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Artículo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Laptop Dell Latitude 7490" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INVENTORY_ITEM_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Dell, HP, Apple" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Latitude 7490, LaserJet Pro M404" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Serie</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingresa el número de serie si aplica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedCategory === "Computadora" && (
              <>
                <FormField
                    control={form.control}
                    name="processor"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Procesador</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Intel Core i5-8350U" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="ram"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Memoria RAM</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "NoEspecificado"}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona RAM" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {RAM_OPTIONS.map((ram) => (
                                    <SelectItem key={ram} value={ram}>{ram}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="storageType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tipo de Disco</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "NoEspecificado"}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {STORAGE_TYPES_WITH_NONE.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type === "NoEspecificado" ? "No Especificado" : type}
                                    </SelectItem>
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
                    name="storage"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Capacidad de Almacenamiento</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: 512GB SSD, 1TB HDD" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {INVENTORY_ITEM_STATUSES.map((stat) => (
                            <SelectItem key={stat} value={stat}>{stat}</SelectItem>
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Bodega Sistemas, Oficina Contabilidad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Cualquier información relevante sobre el artículo." className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

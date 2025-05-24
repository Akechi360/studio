
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon as CalendarLucideIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CreatePaymentRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // onSuccess will be used later
}

export function CreatePaymentRequestDialog({ isOpen, onClose }: CreatePaymentRequestDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDialogClose = () => {
    // Reset local state when dialog closes
    setDate(undefined);
    setIsCalendarOpen(false);
    onClose(); // Call the parent's onClose handler
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarLucideIcon className="mr-2 h-6 w-6 text-primary" />
            Nueva Solicitud de Pago (Prueba de Fecha)
          </DialogTitle>
          <DialogDescription>
            Por favor, selecciona una fecha para probar el calendario.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div>
            <label htmlFor="test-date-picker" className="block text-sm font-medium mb-1">Fecha Requerida (Prueba)</label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="test-date-picker"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  type="button"
                  onClick={() => setIsCalendarOpen(true)} // Explicitly open popover
                >
                  <CalendarLucideIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[51]" align="start"> {/* Increased z-index */}
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    setDate(selectedDate);
                    setIsCalendarOpen(false); // Close popover on date select
                  }}
                  initialFocus
                  disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
                />
              </PopoverContent>
            </Popover>
            {date && <p className="mt-2 text-sm text-muted-foreground">Fecha seleccionada: {format(date, "PPP", { locale: es })}</p>}
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={handleDialogClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => {
            console.log("Fecha de prueba guardada:", date);
            handleDialogClose();
          }}>
            Guardar Prueba
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    
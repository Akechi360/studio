
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { InventoryItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Eye, CalendarDays, UserCircle, Hash, Tag as TagIcon, ListTree, HardDrive, MemoryStick, Cpu, Info, Building, Barcode, Boxes, PackageCheck, Notebook } from 'lucide-react';

interface ViewItemDetailsDialogProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const DetailRow = ({ label, value, icon: Icon }: { label: string; value?: string | number | null | Date; icon?: React.ElementType }) => {
  if (value === undefined || value === null || value === "") return null;
  
  let displayValue: string | React.ReactNode = '';
  if (value instanceof Date) {
    displayValue = format(value, "PPpp", { locale: es });
  } else if (label === "Estado") { // Special handling for Status to use Badge
    const statusColors: Record<InventoryItem["status"], string> = {
        "EnUso": "bg-green-500 text-green-50",
        "EnAlmacen": "bg-blue-500 text-blue-50",
        "EnReparacion": "bg-yellow-500 text-yellow-50",
        "DeBaja": "bg-red-500 text-red-50",
        "Perdido": "bg-gray-500 text-gray-50",
    };
    const statusValue = value as InventoryItem["status"];
    displayValue = (
        <Badge variant="secondary" className={`${statusColors[statusValue] || ''} border-none text-sm py-1`}>
            {statusValue}
        </Badge>
    );
  }
  else {
    displayValue = value.toString();
  }

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-border/30 last:border-b-0">
      {Icon && <Icon className="h-5 w-5 text-primary mt-1 shrink-0" />}
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="text-base text-foreground mt-0.5">{displayValue}</div>
      </div>
    </div>
  );
};

export function ViewItemDetailsDialog({ item, isOpen, onClose }: ViewItemDetailsDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center text-2xl">
            <Eye className="mr-3 h-7 w-7 text-primary" />
            Detalles del Artículo
          </DialogTitle>
          <DialogDescription>
            Información completa para: <strong>{item.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-0 px-6 py-2">
          <DetailRow label="ID de Artículo" value={item.id} icon={Hash} />
          <DetailRow label="Nombre" value={item.name} icon={Notebook} />
          <DetailRow label="Categoría" value={item.category} icon={ListTree} />
          <DetailRow label="Marca" value={item.brand} icon={TagIcon} />
          <DetailRow label="Modelo" value={item.model} icon={Notebook} /> {/* Changed icon */}
          <DetailRow label="Número de Serie" value={item.serialNumber} icon={Barcode} />
          
          {item.category === "Computadora" && (
            <>
              <DetailRow label="Procesador" value={item.processor} icon={Cpu} />
              <DetailRow label="Memoria RAM" value={item.ram} icon={MemoryStick} />
              <DetailRow label="Tipo de Almacenamiento" value={item.storageType} icon={HardDrive} />
              <DetailRow label="Capacidad de Almacenamiento" value={item.storage} icon={HardDrive} />
            </>
          )}
          
          <DetailRow label="Cantidad" value={item.quantity} icon={Boxes} />
          <DetailRow label="Estado" value={item.status} icon={PackageCheck} />
          <DetailRow label="Ubicación (Departamento)" value={item.location} icon={Building} />
          <DetailRow label="Notas Adicionales" value={item.notes} icon={Info} />
          <DetailRow label="Añadido por" value={item.addedByUserName} icon={UserCircle} />
          <DetailRow label="Fecha de Creación" value={item.createdAt} icon={CalendarDays} />
          <DetailRow label="Última Actualización" value={item.updatedAt} icon={CalendarDays} />
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

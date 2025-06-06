
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { CasoDeMantenimiento, CasoMantenimientoStatus, CasoMantenimientoLogEntry, CasoMantenimientoPriority } from '@/lib/types';
import { CASO_STATUSES, CASO_PRIORITIES } from '@/lib/types'; // Importar los enums de types.ts
import { getCasoMantenimientoByIdAction, updateCasoMantenimientoAction } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CalendarIcon, CheckCircle, DollarSign, Edit, FileText, History, Info, ListChecks, Loader2, LocateFixed, Tag, UserCircle, Wrench, MessageSquare, AlertTriangle, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UpdateCasoMantenimientoFormSchema } from '@/lib/schemas';
// CORRECCIÓN: Importar Alert y AlertDescription
import { Alert, AlertDescription, AlertTitle as AlertTitleShadcn } from "@/components/ui/alert";


// Mapas de visualización para CasoMantenimientoStatus (claves sin espacio/acentos, valores con espacio/acentos)
const CASO_STATUS_DISPLAY_MAP: Record<CasoMantenimientoStatus, string> = {
  'Registrado': "Registrado",
  'PendientePresupuesto': "Pendiente Presupuesto", // Clave sin espacio, valor con espacio
  'PresupuestoAprobado': "Presupuesto Aprobado", // Clave sin espacio, valor con espacio
  'EnServicioReparacion': "En Servicio/Reparación", // Clave sin espacio/acentos, valor con espacio/acentos
  'PendienteRespaldo': "Pendiente Respaldo", // Clave sin espacio, valor con espacio
  'Resuelto': "Resuelto",
  'Cancelado': "Cancelado",
};

// Mapas de visualización para CasoMantenimientoPriority (claves sin acentos, valores con acentos)
const CASO_PRIORITY_DISPLAY_MAP: Record<CasoMantenimientoPriority, string> = {
  'Baja': "Baja",
  'Media': "Media",
  'Alta': "Alta",
  'Critica': "Crítica", // Clave sin acento, valor con acento
};


// Colores para el estado (usar las claves sin espacio/acentos)
const statusColors: Record<CasoMantenimientoStatus, string> = {
  'Registrado': "bg-blue-500",
  'PendientePresupuesto': "bg-yellow-500 text-black",
  'PresupuestoAprobado': "bg-teal-500",
  'EnServicioReparacion': "bg-orange-500",
  'PendienteRespaldo': "bg-purple-500",
  'Resuelto': "bg-green-500",
  'Cancelado': "bg-gray-500",
};

// Colores para la prioridad (usar las claves sin acentos)
const priorityColors: Record<CasoMantenimientoPriority, string> = {
  'Baja': "border-green-500 text-green-700 bg-green-50",
  'Media': "border-yellow-500 text-yellow-700 bg-yellow-50",
  'Alta': "border-orange-500 text-orange-700 bg-orange-50",
  'Critica': "border-red-500 text-red-700 bg-red-50",
};


type UpdateCasoFormValues = z.infer<typeof UpdateCasoMantenimientoFormSchema>;

export default function CasoMantenimientoDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const casoId = params.id;
  const { toast } = useToast();

  const [caso, setCaso] = useState<CasoDeMantenimiento | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isResolvedAtCalendarOpen, setIsResolvedAtCalendarOpen] = useState(false);


  const form = useForm<UpdateCasoFormValues>({
    resolver: zodResolver(UpdateCasoMantenimientoFormSchema),
    defaultValues: {
      // CORRECCIÓN: Asegurarse de que los valores iniciales coincidan con los enums sin espacio/acentos
      currentStatus: undefined, // Se establecerá en el reset
      notes: "",
      assignedProviderName: "",
      nextFollowUpDate: undefined,
      resolutionDetails: "",
      cost: undefined,
      invoicingDetails: "",
      resolvedAt: undefined,
    }
  });

  const fetchCasoDetails = useCallback(async () => {
    if (!casoId) return;
    setIsLoading(true);
    try {
      const fetchedCaso = await getCasoMantenimientoByIdAction(casoId);
      setCaso(fetchedCaso);
      if (fetchedCaso) {
        form.reset({
          // CORRECCIÓN: Mapear los valores de la DB a los esperados por el formulario (sin espacio/acentos)
          currentStatus: fetchedCaso.currentStatus, // Asumimos que fetchedCaso.currentStatus ya viene del enum de Prisma (sin espacio/acentos)
          notes: fetchedCaso.log?.[0]?.notes || "", // Tomar la última nota de la bitácora si existe
          assignedProviderName: fetchedCaso.assignedProviderName,
          nextFollowUpDate: fetchedCaso.nextFollowUpDate ? new Date(fetchedCaso.nextFollowUpDate) : undefined,
          resolutionDetails: fetchedCaso.resolutionDetails || "", // Asegurar que sea "" en lugar de null
          cost: fetchedCaso.cost || undefined, // Asegurar que sea undefined en lugar de null
          invoicingDetails: fetchedCaso.invoicingDetails || "", // Asegurar que sea "" en lugar de null
          resolvedAt: fetchedCaso.resolvedAt ? new Date(fetchedCaso.resolvedAt) : undefined, // Asegurar que sea Date o undefined
        });
      }
    } catch (error) {
      console.error("Error fetching caso details:", error);
      toast({ title: "Error", description: "No se pudo cargar el caso de mantenimiento.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [casoId, toast, form]);

  useEffect(() => {
    fetchCasoDetails();
  }, [fetchCasoDetails]);

  const handleUpdateSubmit = async (data: UpdateCasoFormValues) => {
    if (!user || !user.email || !user.id || !user.name || !caso) {
      toast({ title: "Error", description: "No se pudo actualizar el caso. Usuario o caso no disponible.", variant: "destructive" });
      return;
    }
    setIsSubmittingUpdate(true);

    try {
      const result = await updateCasoMantenimientoAction(
        caso.id,
        data, // Pass the whole form data, action will pick relevant fields
        user.id,
        user.name,
        user.email
      );
      if (result.success) {
        toast({ title: "Actualización Exitosa", description: result.message });
        fetchCasoDetails();
        form.reset({ ...form.getValues(), notes: "" });
      } else {
        toast({ title: "Error al Actualizar", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Error submitting update:", error);
      toast({ title: "Error Inesperado", description: "Ocurrió un error al actualizar.", variant: "destructive" });
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const canManageCase = user && user.email === 'electromedicina@clinicaieq.com';
  const watchedStatus = form.watch("currentStatus");

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-10 w-10 animate-spin text-primary" /> Cargando detalles...</div>;
  }

  if (!caso) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        {/* CORRECCIÓN: Usar el componente Alert importado */}
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          <AlertTitleShadcn className="text-xl font-bold">Caso No Encontrado</AlertTitleShadcn> {/* Usar AlertTitleShadcn */}
          <AlertDescription className="mb-4">El caso de mantenimiento que estás buscando no existe (ID: {casoId}).</AlertDescription>
          <Button asChild variant="outline"><Link href="/mantenimiento"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Gestión</Link></Button>
        </Alert>
      </div>
    );
  }

  const DetailRow = ({ label, value, icon: IconComp }: { label: string; value?: string | number | Date | null; icon?: React.ElementType }) => {
    if (value === undefined || value === null || value === "") return null;
    let displayValue: React.ReactNode = value.toString();
    if (value instanceof Date) {
      displayValue = format(value, "PPpp", { locale: es });
    } else if (label === "Prioridad") {
      // CORRECCIÓN: Usar el mapa de visualización para la prioridad
      displayValue = <Badge variant="outline" className={cn(priorityColors[value as CasoMantenimientoPriority], "border")}>{CASO_PRIORITY_DISPLAY_MAP[value as CasoMantenimientoPriority] || value as string}</Badge>;
    } else if (label === "Costo") {
      displayValue = (value as number).toLocaleString('es-ES', { style: 'currency', currency: 'USD' });
    }
    return (
      <div className="flex items-start space-x-3 py-2 border-b border-border/20 last:border-b-0">
        {IconComp && <IconComp className="h-5 w-5 text-primary mt-0.5 shrink-0" />}
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{displayValue}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight flex items-center">
          <Wrench className="mr-3 h-7 w-7 text-primary" />
          Detalle del Caso: {caso.title}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/mantenimiento"><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link>
        </Button>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{caso.title}</CardTitle>
            {/* CORRECCIÓN: Usar el mapa de visualización para el estado */}
            <Badge className={`text-white ${statusColors[caso.currentStatus]}`}>{CASO_STATUS_DISPLAY_MAP[caso.currentStatus] || caso.currentStatus}</Badge>
          </div>
          <CardDescription>ID del Caso: {caso.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="Descripción" value={caso.description} icon={FileText} />
          <DetailRow label="Ubicación" value={caso.location} icon={LocateFixed} />
          <DetailRow label="Equipo" value={caso.equipment} icon={Info} />
          <DetailRow label="Prioridad" value={caso.priority} icon={Tag} />
          <DetailRow label="Registrado por" value={`${caso.registeredByUserName} (ID: ${caso.registeredByUserId})`} icon={UserCircle} />
          <DetailRow label="Fecha de Registro" value={caso.registeredAt} icon={CalendarIcon} />
          <DetailRow label="Proveedor Asignado" value={caso.assignedProviderName} icon={UserCircle} />
          <DetailRow label="Contacto Proveedor" value={caso.providerContactPerson} icon={MessageSquare}/>
          <DetailRow label="Fecha Estimada Resolución" value={caso.expectedResolutionDate} icon={CalendarIcon} />
          <DetailRow label="Último Seguimiento" value={caso.lastFollowUpDate} icon={CalendarIcon} />
          <DetailRow label="Próximo Seguimiento" value={caso.nextFollowUpDate} icon={CalendarClock} />
          {caso.currentStatus === 'Resuelto' && (
            <>
              <DetailRow label="Detalles de Resolución" value={caso.resolutionDetails} icon={CheckCircle} />
              <DetailRow label="Costo" value={caso.cost} icon={DollarSign} />
              <DetailRow label="Detalles de Facturación" value={caso.invoicingDetails} icon={FileText} />
              <DetailRow label="Fecha de Resolución" value={caso.resolvedAt} icon={CalendarIcon} />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="w-full shadow-lg">
        <CardHeader><CardTitle className="text-lg flex items-center"><History className="mr-2 h-5 w-5 text-primary"/>Bitácora de Actividad</CardTitle></CardHeader>
        <CardContent>
          {caso.log && caso.log.length > 0 ? (
            <ul className="space-y-3">
              {[...caso.log].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((entry, index) => (
                <li key={index} className="p-3 border rounded-md bg-muted/20 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-primary">{entry.action}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(entry.timestamp), "PPpp", { locale: es })}</span>
                  </div>
                  <p className="text-muted-foreground">Por: {entry.userName}</p>
                  {entry.notes && <p className="mt-1 italic text-foreground/80">Notas: "{entry.notes}"</p>}
                  {entry.statusAfterAction && <p className="text-xs mt-1">Estado resultante: <Badge variant="secondary" className={`text-white text-xs ${statusColors[entry.statusAfterAction] || 'bg-gray-500'}`}>{CASO_STATUS_DISPLAY_MAP[entry.statusAfterAction] || entry.statusAfterAction}</Badge></p>} {/* CORRECCIÓN: Usar el mapa de visualización */}
                </li>
              ))}
            </ul>
          ) : <p className="text-muted-foreground">No hay actividad registrada para este caso.</p>}
        </CardContent>
      </Card>

      {canManageCase && (
        <Card className="w-full shadow-lg border-primary/30">
          <CardHeader><CardTitle className="text-lg flex items-center"><Edit className="mr-2 h-5 w-5 text-primary"/>Actualizar Caso de Mantenimiento</CardTitle></CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdateSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="currentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuevo Estado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {/* CORRECCIÓN: Usar los valores del enum de Prisma (sin espacio/acentos) */}
                          {CASO_STATUSES.map(status => <SelectItem key={status} value={status}>{CASO_STATUS_DISPLAY_MAP[status] || status}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas de Actualización *</FormLabel>
                      <FormControl><Textarea placeholder="Detalles de la actualización, comunicación con proveedor, etc." {...field} value={field.value || ""} className="min-h-[100px]"/></FormControl> {/* CORRECCIÓN: value={field.value || ""} */}
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
                      <FormControl><Input placeholder="Nombre del proveedor" {...field} value={field.value || ""} /></FormControl> {/* CORRECCIÓN: value={field.value || ""} */}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nextFollowUpDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="mb-1.5">Próximo Seguimiento</FormLabel>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" type="button" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[51]" align="start">
                          {/* CORRECCIÓN: Asegurar que selected sea Date o undefined */}
                          <Calendar mode="single" selected={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)} onSelect={(date) => { field.onChange(date); setIsCalendarOpen(false); }} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedStatus === 'Resuelto' && (
                  <Card className="p-4 border-dashed mt-4">
                    <CardTitle className="text-md mb-3">Detalles de Resolución (Obligatorio si estado es 'Resuelto')</CardTitle>
                    <div className="space-y-4">
                      <FormField control={form.control} name="resolutionDetails" render={({ field }) => (
                        <FormItem><FormLabel>Detalles de Resolución *</FormLabel><FormControl><Textarea placeholder="Descripción de la solución aplicada" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="resolvedAt" render={({ field }) => (
                         <FormItem className="flex flex-col"><FormLabel className="mb-1.5">Fecha de Resolución *</FormLabel>
                          <Popover open={isResolvedAtCalendarOpen} onOpenChange={setIsResolvedAtCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" type="button" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[51]" align="start">
                              {/* CORRECCIÓN: Asegurar que selected sea Date o undefined */}
                              <Calendar mode="single" selected={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)} onSelect={(date) => { field.onChange(date); setIsResolvedAtCalendarOpen(false);}} initialFocus />
                            </PopoverContent>
                          </Popover><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="cost" render={({ field }) => (
                        <FormItem><FormLabel>Costo (USD)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} value={field.value || 0} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="invoicingDetails" render={({ field }) => (
                        <FormItem><FormLabel>Detalles de Facturación</FormLabel><FormControl><Textarea placeholder="Información de factura, N° de control, etc." {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                      )}/>
                    </div>
                  </Card>
                )}
                <Button type="submit" disabled={isSubmittingUpdate} className="w-full sm:w-auto">
                  {isSubmittingUpdate ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ListChecks className="mr-2 h-4 w-4" />}
                  Registrar Actualización
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

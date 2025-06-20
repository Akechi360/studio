"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { approveRequestAction, rejectRequestAction, requestMoreInfoAction } from '@/lib/actions';
import type { ApprovalRequest, ApprovalStatus, ApprovalRequestType, PaymentInstallment, PaymentType } from '@/lib/types';
import { Loader2, CheckCircle, XCircle, HelpCircle, MessageSquareWarning, PlusCircle, Trash2, CalendarIcon, CreditCard, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para generar un ID único compatible con el navegador y Node.js
// Usamos un fallback si crypto.randomUUID no está disponible (ej. en ciertos entornos de prueba o SSR sin polyfill)
const generateUniqueId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return String(crypto.randomUUID());
  }
  return String(Date.now().toString(36) + Math.random().toString(36).substring(2));
};


const paymentInstallmentSchema = z.object({
  id: z.string(),
  displayId: z.string(),
  amount: z.coerce.number().positive("El monto debe ser positivo."),
  dueDate: z.date({ required_error: "La fecha de vencimiento es obligatoria." }),
});

const approvalActionsFormSchema = z.object({
  comment: z.string().optional(),
  approvedPaymentType: z.enum(['Contado', 'Cuotas']).optional(),
  // Aseguramos que approvedAmount sea un número o undefined, pero nunca null.
  // Transformamos null a undefined para consistencia con optional().
  approvedAmount: z.coerce.number().positive("El monto aprobado debe ser positivo.").optional().nullable().transform(e => e === null ? undefined : e),
  installments: z.array(paymentInstallmentSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.approvedPaymentType === 'Cuotas') {
    if (data.approvedAmount === undefined || data.approvedAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El 'Monto Aprobado para Cuotas' es obligatorio si se seleccionan cuotas.",
        path: ["approvedAmount"],
      });
    } else if (data.installments && data.installments.length > 0) {
      const sumOfInstallments = data.installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
      if (Math.abs(sumOfInstallments - data.approvedAmount) > 0.01) { // Tolerance for float precision
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La suma de los montos de las cuotas debe ser igual al 'Monto Aprobado para Cuotas'.",
          path: ["installments"],
        });
      }
    } else { // No installments, but 'Cuotas' selected and approvedAmount is positive
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debe añadir al menos una cuota si el tipo de pago es 'Por Cuotas' y hay un monto aprobado.",
            path: ["installments"],
        });
    }
  } else if (data.approvedPaymentType === 'Contado') {
    if (data.approvedAmount === undefined || data.approvedAmount <= 0) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El 'Monto Aprobado (Contado)' es obligatorio si el tipo de pago es 'Contado'.",
        path: ["approvedAmount"],
      });
    }
  }
});

type ApprovalActionsFormValues = z.infer<typeof approvalActionsFormSchema>;

interface ApprovalActionsPanelProps {
  requestId: string;
  currentRequest: ApprovalRequest; 
  requestType: ApprovalRequestType;
  onActionSuccess: () => void;
}

export function ApprovalActionsPanel({ requestId, currentRequest, requestType, onActionSuccess }: ApprovalActionsPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<"approve" | "reject" | "requestInfo" | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [openCalendarIndex, setOpenCalendarIndex] = useState<number | null>(null);

  // Log global para depuración
  useEffect(() => {
    console.log('DEBUG: openCalendarIndex', openCalendarIndex);
  }, [openCalendarIndex]);

  const form = useForm<ApprovalActionsFormValues>({
    resolver: zodResolver(approvalActionsFormSchema),
    defaultValues: { // Static initial defaults
      comment: "",
      approvedPaymentType: 'Contado',
      approvedAmount: 0, // Aseguramos que sea 0, no undefined o null
      installments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "installments",
  });

  useEffect(() => {
    if (currentRequest) {
      const defaultPaymentType = currentRequest.approvedPaymentType || (requestType === "PagoProveedor" ? 'Contado' : undefined);
      const defaultApprovedAmount = currentRequest.approvedAmount !== null && currentRequest.approvedAmount !== undefined 
          ? currentRequest.approvedAmount 
          : (requestType === "PagoProveedor" ? (currentRequest.totalAmountToPay || 0) : undefined);

      form.reset({
        comment: currentRequest.approverComment || "",
        approvedPaymentType: defaultPaymentType,
        approvedAmount: defaultApprovedAmount,
        installments: (defaultPaymentType === 'Cuotas' && Array.isArray(currentRequest.paymentInstallments)) ?
            currentRequest.paymentInstallments.map(inst => ({
                id: String(inst.id || generateUniqueId()),
                displayId: String(inst.displayId || generateUniqueId()),
                amount: inst.amount || 0,
                dueDate: inst.dueDate && !isNaN(new Date(inst.dueDate).getTime()) ? new Date(inst.dueDate) : new Date(),
            }))
            : [],
      });
    }
  }, [currentRequest, requestType, form.reset]);


  const watchedInstallments = form.watch("installments");
  const watchedApprovedAmount = form.watch("approvedAmount");
  const watchedPaymentType = form.watch("approvedPaymentType");

  useEffect(() => {
    if (watchedPaymentType === 'Contado') {
      form.setValue('installments', []); 
    } else if (watchedPaymentType === 'Cuotas') {
      // Si el monto aprobado no está definido y hay un monto total a pagar en la solicitud, lo establecemos.
      // Aseguramos que el valor sea un número.
      if ((form.getValues('approvedAmount') === undefined || form.getValues('approvedAmount') === null) && currentRequest?.totalAmountToPay) {
        form.setValue('approvedAmount', currentRequest.totalAmountToPay);
      }
    }
  }, [watchedPaymentType, form, currentRequest?.totalAmountToPay]);


  const sumOfInstallments = React.useMemo(() => {
    return watchedInstallments?.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0) || 0;
  }, [watchedInstallments]);

  const difference = React.useMemo(() => {
    const approved = Number(watchedApprovedAmount) || 0;
    return approved - sumOfInstallments;
  }, [watchedApprovedAmount, sumOfInstallments]);

  const handleActionClick = (action: "approve" | "reject" | "requestInfo") => {
    // Forzamos la validación del formulario antes de abrir el modal de confirmación
    form.trigger().then(isValid => { 
      if (isValid) {
        // Validación adicional para comentario si es rechazo o solicitud de info
        if ((action === 'reject' || action === 'requestInfo') && !form.getValues("comment")?.trim()) {
          form.setError("comment", { type: "manual", message: "Se requiere un comentario para esta acción." });
          return;
        }
        setActionToConfirm(action);
        setIsConfirmOpen(true);
      } else {
         const errors = form.formState.errors;
         let errorMsg = "Por favor, corrija los errores del formulario.";
         // Mensajes de error más específicos para el usuario
         if (errors.approvedAmount?.message) errorMsg = errors.approvedAmount.message;
         else if (errors.installments?.message) errorMsg = errors.installments.message;
         else if (errors.installments?.[0]?.amount?.message) errorMsg = `Cuota 1: ${errors.installments[0].amount.message}`;
         else if (errors.installments?.[0]?.dueDate?.message) errorMsg = `Cuota 1: ${errors.installments[0].dueDate.message}`;

        toast({ title: "Error de Validación", description: errorMsg, variant: "destructive"});
      }
    });
  };

  const handleConfirmAction = async () => {
    if (!user || !user.email || !actionToConfirm) return;

    const formData = form.getValues();
    setIsSubmitting(true);

    let result;
    let actionData: any = { 
      requestId,
      approverId: user.id,
      approverName: user.name || "Usuario del Sistema",
      approverEmail: user.email,
      comment: formData.comment?.trim() || undefined,
    };

    try {
      if (actionToConfirm === 'approve') {
        if (requestType === "PagoProveedor" && user.role === 'Presidente') { 
          actionData.approvedPaymentType = formData.approvedPaymentType;
          actionData.approvedAmount = formData.approvedAmount !== undefined ? formData.approvedAmount : 0;
          if (formData.approvedPaymentType === 'Cuotas') {
            actionData.installments = formData.installments;
          } else {
            actionData.installments = []; 
          }
        }
        // --- Log para depuración antes de enviar ---
        if (actionData.installments) {
          actionData.installments = actionData.installments.map((inst: any) => ({
            ...inst,
            displayId:
              typeof inst.displayId === 'string' && inst.displayId.length > 0
                ? inst.displayId
                : String(generateUniqueId()),
          }));
          console.log("Installments to send:", actionData.installments);
        }
        // ---------------------------------------------------
         result = await approveRequestAction(actionData);
      } else if (actionToConfirm === 'reject') {
        result = await rejectRequestAction({ ...actionData, comment: formData.comment!.trim() });
      } else if (actionToConfirm === 'requestInfo') {
        result = await requestMoreInfoAction({ ...actionData, comment: formData.comment!.trim() });
      } else {
        throw new Error("Acción desconocida.");
      }


      if (result.success) {
        toast({ title: "Acción Completada", description: result.message });
        onActionSuccess();
      } else {
        toast({ title: "Error en la Acción", description: result.message || "Ocurrió un error desconocido.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error Inesperado", description: "Ocurrió un error al procesar la acción.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
      setActionToConfirm(null);
    }
  };

  const handleDateSelect = (date: Date | undefined, index: number, onChange: (date: Date | undefined) => void) => {
    onChange(date);
    setOpenCalendarIndex(null); // Cierra el Popover siempre
  };

  const handleCalendarOpen = (index: number, e: React.MouseEvent) => {
    console.log('handleCalendarOpen llamado:', { index, currentOpenIndex: openCalendarIndex });
    e.preventDefault();
    e.stopPropagation();
    setOpenCalendarIndex(openCalendarIndex === index ? null : index);
  };

  if (!currentRequest) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" /> Cargando datos del panel...
      </div>
    );
  }

  // This check now allows 'InformacionSolicitada' as well
  if (currentRequest.status !== 'Pendiente' && currentRequest.status !== 'InformacionSolicitada') {
    return null;
  }

  const getConfirmationDetails = () => {
    switch (actionToConfirm) {
      case 'approve': return { title: "Confirmar Aprobación", description: "¿Estás seguro de que deseas aprobar esta solicitud?" };
      case 'reject': return { title: "Confirmar Rechazo", description: "¿Estás seguro de que deseas rechazar esta solicitud? Se requiere un comentario." };
      case 'requestInfo': return { title: "Confirmar Solicitud de Información", description: "¿Estás seguro de que deseas solicitar más información? Se requiere un comentario." };
      default: return { title: "", description: "" };
    }
  };

  const confirmationDetails = getConfirmationDetails();
  const isPresidente = user?.role === 'Presidente'; 

  return (
    <Card className="w-full shadow-lg border-primary/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center"><CheckCircle className="mr-2 h-5 w-5 text-primary"/>Tomar Acción</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            {requestType === 'PagoProveedor' && isPresidente && (
              <Card className="p-4 border-dashed">
                <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-md">Gestión de Tipo de Pago</CardTitle>
                    <CardDescription>Selecciona cómo se aprobará este pago.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                   <FormField
                    control={form.control}
                    name="approvedPaymentType"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Tipo de Pago Aprobado *</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col sm:flex-row gap-4"
                            >
                            <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                <RadioGroupItem value="Contado" id="contado" />
                                </FormControl>
                                <FormLabel htmlFor="contado" className="font-normal">Contado</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                <RadioGroupItem value="Cuotas" id="cuotas" />
                                </FormControl>
                                <FormLabel htmlFor="cuotas" className="font-normal">Por Cuotas</FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    {watchedPaymentType === 'Contado' && (
                         <FormField
                            control={form.control}
                            name="approvedAmount"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monto Aprobado (Contado) *</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="Monto total a pagar de contado" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}

                    {watchedPaymentType === 'Cuotas' && (
                        <>
                         <FormField
                            control={form.control}
                            name="approvedAmount"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monto Aprobado para Distribuir en Cuotas *</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="Monto total a distribuir" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <CardTitle className="text-sm pt-2">Definición de Cuotas</CardTitle>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-2">
                            <FormField
                                control={form.control}
                                name={`installments.${index}.amount`}
                                render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className="mb-1.5 block sm:hidden">Monto Cuota {index + 1}</FormLabel>
                                    <FormLabel className="mb-1.5 hidden sm:block">&nbsp;</FormLabel>
                                    <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Monto de la cuota"
                                        {...field}
                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`installments.${index}.dueDate`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-col flex-1 mt-0 sm:mt-[6px]">
                                        <FormLabel className="mb-1.5 block sm:hidden">Fecha Cuota {index + 1}</FormLabel>
                                        <FormLabel className="mb-1.5 hidden sm:block">&nbsp;</FormLabel>
                                        <Popover
                                            open={openCalendarIndex === index}
                                            onOpenChange={(open) => {
                                                setOpenCalendarIndex(open ? index : null);
                                            }}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCalendarIndex === index}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? (
                                                        format(field.value instanceof Date ? field.value : new Date(field.value), "PPP", { locale: es })
                                                    ) : (
                                                        <span>Selecciona fecha</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                                side="bottom"
                                                sideOffset={4}
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)}
                                                    onSelect={(date) => handleDateSelect(date, index, field.onChange)}
                                                    initialFocus
                                                    disabled={(date) => date < new Date()}
                                                    locale={es}
                                                    className="rounded-md border"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="text-destructive hover:bg-destructive/10 mt-2 sm:mt-7 shrink-0"
                                aria-label="Eliminar cuota"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ id: String(generateUniqueId()), displayId: String(generateUniqueId()), amount: 0, dueDate: new Date() })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Cuota
                        </Button>
                        <div className="mt-2 text-sm space-y-1">
                            <p>Suma de Cuotas: <span className="font-semibold">{sumOfInstallments.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span></p>
                            <p className={cn(difference !== 0 ? "text-destructive" : "text-green-600")}>
                                Diferencia: <span className="font-semibold">{difference.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span>
                                {difference !== 0 && " (La suma de cuotas debe ser igual al Monto Aprobado)"}
                            </p>
                        </div>
                         <FormMessage>{form.formState.errors.installments?.message || (form.formState.errors.installments && (form.formState.errors.installments as any).root?.message )}</FormMessage>
                        </>
                    )}
                </CardContent>
              </Card>
            )}

            {!(requestType === 'PagoProveedor' && isPresidente) && requestType === 'PagoProveedor' && (
                 <div className="p-4 bg-muted/50 rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground font-semibold">
                        <MessageSquareWarning className="inline-block mr-2 h-4 w-4 text-yellow-600" />
                        Funcionalidad de Pago por Cuotas/Calendario:
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                         La división de pagos y selección de fechas específicas se implementará en una futura actualización. Por ahora, "Aprobar" aceptará el monto total indicado.
                    </p>
                </div>
            )}

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentario del Aprobador:</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade un comentario (requerido para rechazar o solicitar más información)..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""} // Aseguramos que el valor sea "" si es null/undefined
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este comentario será visible en el historial de actividad de la solicitud.
                  </p>
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
              <Button
                variant="destructive"
                onClick={() => handleActionClick('reject')}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
                type="button"
              >
                {isSubmitting && actionToConfirm === 'reject' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>}
                Rechazar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleActionClick('requestInfo')}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
                type="button"
              >
                {isSubmitting && actionToConfirm === 'requestInfo' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <HelpCircle className="mr-2 h-4 w-4"/>}
                Solicitar Información
              </Button>
              <Button
                onClick={() => handleActionClick('approve')}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                type="button"
              >
                {isSubmitting && actionToConfirm === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                Aprobar
              </Button>
            </div>
          </form>
        </Form>
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmationDetails.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmationDetails.description}
                {actionToConfirm === 'approve' && requestType === "PagoProveedor" && isPresidente && watchedPaymentType === 'Cuotas' && difference !== 0 && (
                    <div className="mt-2 font-semibold text-destructive">
                        ¡Atención! La suma de las cuotas no coincide con el Monto Aprobado para Cuotas.
                    </div>
                )}
                 {actionToConfirm === 'approve' && requestType === "PagoProveedor" && isPresidente && watchedPaymentType === 'Contado' && (!watchedApprovedAmount || watchedApprovedAmount <= 0) && (
                    <div className="mt-2 font-semibold text-destructive">
                        ¡Atención! El Monto Aprobado (Contado) debe ser mayor que cero.
                    </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsConfirmOpen(false)} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                disabled={isSubmitting || 
                    (actionToConfirm === 'approve' && requestType === "PagoProveedor" && isPresidente && watchedPaymentType === 'Cuotas' && (difference !== 0 || (watchedInstallments || []).length === 0)) ||
                    (actionToConfirm === 'approve' && requestType === "PagoProveedor" && isPresidente && watchedPaymentType === 'Contado' && (!watchedApprovedAmount || watchedApprovedAmount <= 0))
                }
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
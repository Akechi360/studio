
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
import type { ApprovalRequest, ApprovalStatus, ApprovalRequestType, PaymentInstallment } from '@/lib/types';
import { Loader2, CheckCircle, XCircle, HelpCircle, MessageSquareWarning, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


const paymentInstallmentSchema = z.object({
  id: z.string(),
  amount: z.coerce.number().positive("El monto debe ser positivo."),
  dueDate: z.date({ required_error: "La fecha de vencimiento es obligatoria." }),
});

const approvalActionsFormSchema = z.object({
  comment: z.string().optional(),
  approvedAmount: z.coerce.number().positive("El monto aprobado debe ser positivo.").optional(),
  installments: z.array(paymentInstallmentSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.installments && data.installments.length > 0) {
    if (data.approvedAmount === undefined || data.approvedAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El 'Monto Aprobado para Cuotas' es obligatorio si se añaden cuotas.",
        path: ["approvedAmount"],
      });
    } else {
      const sumOfInstallments = data.installments.reduce((sum, inst) => sum + inst.amount, 0);
      if (Math.abs(sumOfInstallments - data.approvedAmount) > 0.01) { // Tolerance for float precision
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La suma de los montos de las cuotas debe ser igual al 'Monto Aprobado para Cuotas'.",
          path: ["installments"],
        });
      }
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

  const form = useForm<ApprovalActionsFormValues>({
    resolver: zodResolver(approvalActionsFormSchema),
    defaultValues: {
      comment: "",
      approvedAmount: 0,
      installments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "installments",
  });

  useEffect(() => {
    if (currentRequest) {
      form.reset({
        comment: currentRequest.approverComment || "",
        approvedAmount: requestType === "PagoProveedor" ? (currentRequest.totalAmountToPay || 0) : 0,
        installments: requestType === "PagoProveedor" && currentRequest.paymentInstallments ?
            currentRequest.paymentInstallments.map(inst => ({
                id: inst.id || crypto.randomUUID(),
                amount: inst.amount || 0,
                dueDate: inst.dueDate && !isNaN(new Date(inst.dueDate).getTime()) ? new Date(inst.dueDate) : new Date(),
            }))
            : [],
      });
    }
  }, [currentRequest, requestType, form.reset]);


  const watchedInstallments = form.watch("installments");
  const watchedApprovedAmount = form.watch("approvedAmount");

  const sumOfInstallments = React.useMemo(() => {
    return watchedInstallments?.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0) || 0;
  }, [watchedInstallments]);

  const difference = React.useMemo(() => {
    const approved = Number(watchedApprovedAmount) || 0;
    return approved - sumOfInstallments;
  }, [watchedApprovedAmount, sumOfInstallments]);

  const handleActionClick = (action: "approve" | "reject" | "requestInfo") => {
    form.handleSubmit(
      (data) => {
        if ((action === 'reject' || action === 'requestInfo') && !data.comment?.trim()) {
          form.setError("comment", { type: "manual", message: "Se requiere un comentario para esta acción." });
          return;
        }
        setActionToConfirm(action);
        setIsConfirmOpen(true);
      },
      (errors) => {
        console.error("Validation errors:", errors);
        if (action === 'approve' && errors.installments) {
            toast({ title: "Error en Cuotas", description: errors.installments.message || "Revise las cuotas.", variant: "destructive"});
        } else if (action === 'approve' && errors.approvedAmount) {
             toast({ title: "Error en Monto Aprobado", description: errors.approvedAmount.message || "Revise el monto aprobado.", variant: "destructive"});
        }
      }
    )();
  };

  const handleConfirmAction = async () => {
    if (!user || !user.email || !actionToConfirm) return;

    const formData = form.getValues();
    setIsSubmitting(true);

    let result;
    const baseActionData = {
      requestId,
      approverId: user.id,
      approverName: user.name || "Usuario del Sistema",
      approverEmail: user.email,
      comment: formData.comment?.trim() || undefined,
    };

    try {
      switch (actionToConfirm) {
        case 'approve':
          const approveData = {
            ...baseActionData,
            approvedAmount: requestType === "PagoProveedor" ? formData.approvedAmount : undefined,
            installments: requestType === "PagoProveedor" ? formData.installments : undefined,
          };
          result = await approveRequestAction(approveData);
          break;
        case 'reject':
          result = await rejectRequestAction({ ...baseActionData, comment: formData.comment!.trim() });
          break;
        case 'requestInfo':
          result = await requestMoreInfoAction({ ...baseActionData, comment: formData.comment!.trim() });
          break;
        default:
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

  if (!currentRequest) {
    return <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (currentRequest.status !== 'Pendiente') {
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
  const isPresidente = user?.role === 'Presidente IEQ';

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
                    <CardTitle className="text-md">Gestión de Pago por Cuotas</CardTitle>
                    <CardDescription>Ajusta el monto total a aprobar y divide el pago en cuotas.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <FormField
                        control={form.control}
                        name="approvedAmount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Monto Aprobado para Cuotas *</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Monto total a distribuir" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {fields.map((item, index) => (
                        <div key={item.id} className="flex flex-col sm:flex-row items-start gap-3 p-3 border rounded-md bg-muted/30">
                        <FormField
                            control={form.control}
                            name={`installments.${index}.amount`}
                            render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Monto Cuota {index + 1}</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="Monto" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
                                <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                    type="button"
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value instanceof Date ? field.value : new Date(field.value), "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[51]" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)}
                                        onSelect={field.onChange}
                                        initialFocus
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
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ id: crypto.randomUUID(), amount: 0, dueDate: new Date() })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir Cuota
                    </Button>
                    <div className="mt-2 text-sm space-y-1">
                        <p>Suma de Cuotas: <span className="font-semibold">{sumOfInstallments.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span></p>
                        <p className={cn(difference !== 0 ? "text-destructive" : "text-green-600")}>
                            Diferencia: <span className="font-semibold">{difference.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span>
                            {difference !== 0 && " (La suma de cuotas debe ser igual al Monto Aprobado)"}
                        </p>
                    </div>
                     <FormMessage>{form.formState.errors.installments?.message}</FormMessage>
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
                      value={field.value || ""}
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
                {actionToConfirm === 'approve' && requestType === "PagoProveedor" && isPresidente && difference !== 0 && (
                    <div className="mt-2 font-semibold text-destructive">
                        ¡Atención! La suma de las cuotas no coincide con el Monto Aprobado para Cuotas.
                    </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsConfirmOpen(false)} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                disabled={isSubmitting || (actionToConfirm === 'approve' && requestType === "PagoProveedor" && isPresidente && difference !== 0)}
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

    

"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Removed AlertDialogTrigger as it's not used directly here
import { useToast } from '@/hooks/use-toast';
import { approveRequestAction, rejectRequestAction, requestMoreInfoAction } from '@/lib/actions';
import type { ApprovalRequest, ApprovalStatus, ApprovalRequestType } from '@/lib/types';
import { Loader2, CheckCircle, XCircle, HelpCircle, MessageSquareWarning } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';


interface ApprovalActionsPanelProps {
  requestId: string;
  currentRequestStatus: ApprovalStatus;
  requestType: ApprovalRequestType;
  onActionSuccess: () => void;
}

type ActionType = "approve" | "reject" | "requestInfo";

export function ApprovalActionsPanel({ requestId, currentRequestStatus, requestType, onActionSuccess }: ApprovalActionsPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<ActionType | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleActionClick = (action: ActionType) => {
    if ((action === 'reject' || action === 'requestInfo') && !comment.trim()) {
      toast({
        title: "Comentario Requerido",
        description: "Por favor, añade un comentario para esta acción.",
        variant: "destructive",
      });
      return;
    }
    setActionToConfirm(action);
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!user || !user.email || !actionToConfirm) return;
    setIsSubmitting(true);

    let result;
    const actionData = {
      requestId,
      approverId: user.id,
      approverName: user.name || "Usuario del Sistema", // Fallback name
      approverEmail: user.email,
      comment: comment.trim() || undefined,
    };
    const actionDataWithRequiredComment = {
      requestId,
      approverId: user.id,
      approverName: user.name || "Usuario del Sistema", // Fallback name
      approverEmail: user.email,
      comment: comment.trim(),
    };

    try {
      switch (actionToConfirm) {
        case 'approve':
          result = await approveRequestAction(actionData);
          break;
        case 'reject':
          result = await rejectRequestAction(actionDataWithRequiredComment);
          break;
        case 'requestInfo':
          result = await requestMoreInfoAction(actionDataWithRequiredComment);
          break;
        default:
          throw new Error("Acción desconocida.");
      }

      if (result.success) {
        toast({ title: "Acción Completada", description: result.message });
        setComment("");
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

  if (currentRequestStatus !== 'Pendiente') {
    return null; // Only show panel for pending requests
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


  return (
    <Card className="w-full shadow-lg border-primary/30">
        <CardHeader>
            <CardTitle className="text-lg flex items-center"><CheckCircle className="mr-2 h-5 w-5 text-primary"/>Tomar Acción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            {requestType === 'PagoProveedor' && (
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

            <div>
                <label htmlFor="approverComment" className="block text-sm font-medium text-foreground mb-1">
                Comentario del Aprobador:
                </label>
                <Textarea
                id="approverComment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Añade un comentario (requerido para rechazar o solicitar más información)..."
                className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Este comentario será visible en el historial de actividad de la solicitud.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                    variant="destructive"
                    onClick={() => handleActionClick('reject')}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                >
                {isSubmitting && actionToConfirm === 'reject' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>}
                Rechazar
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleActionClick('requestInfo')}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                >
                {isSubmitting && actionToConfirm === 'requestInfo' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <HelpCircle className="mr-2 h-4 w-4"/>}
                Solicitar Información
                </Button>
                <Button
                    onClick={() => handleActionClick('approve')}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                >
                {isSubmitting && actionToConfirm === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                Aprobar
                </Button>
            </div>
             <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{confirmationDetails.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {confirmationDetails.description}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsConfirmOpen(false)} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmAction} disabled={isSubmitting}>
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

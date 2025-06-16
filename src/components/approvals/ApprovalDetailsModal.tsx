"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getApprovalRequestById } from "@/lib/actions";
import { ApprovalRequest, ApprovalRequestType, ApprovalActivityLogEntry } from "@/lib/types";
import { ApprovalStatus } from "@prisma/client";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  FileIcon, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  User, 
  MessageSquare, 
  ShoppingCart, 
  CreditCard,
  Loader2,
  Calendar,
  Paperclip,
  FileText
} from "lucide-react";
import { ApprovalActionsPanel } from './approval-actions-panel';

interface ApprovalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | null;
  onActionSuccess?: () => void;
}

const typeDisplayMap: Record<ApprovalRequest["type"], string> = {
  Compra: "Solicitud de Compra",
  PagoProveedor: "Solicitud de Pago",
};

const typeIconMap: Record<ApprovalRequest["type"], React.ElementType> = {
  Compra: ShoppingCart,
  PagoProveedor: CreditCard,
};

const statusDisplayMap: Record<ApprovalRequest["status"], string> = {
  Pendiente: "Pendiente",
  Aprobado: "Aprobado",
  Rechazado: "Rechazado",
  InformacionSolicitada: "Información Solicitada",
};

const statusColors: Record<ApprovalRequest["status"], string> = {
  Pendiente: "bg-yellow-500 hover:bg-yellow-600",
  Aprobado: "bg-green-500 hover:bg-green-600",
  Rechazado: "bg-red-500 hover:bg-red-600",
  InformacionSolicitada: "bg-blue-500 hover:bg-blue-600",
};

const getActivityIcon = (action: string) => {
  switch (action) {
    case "Solicitud Creada":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "Solicitud Aprobada":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "Solicitud Rechazada":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "Información Adicional Solicitada":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

export function ApprovalDetailsModal({ isOpen, onClose, requestId, onActionSuccess }: ApprovalDetailsModalProps) {
  const { toast } = useToast();
  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function loadRequestDetails() {
      if (!requestId) return;
      setIsLoading(true);
      setError(null);
      try {
        const result = await getApprovalRequestById(requestId);
        if (!result) {
          setError("No se pudo cargar la solicitud");
          toast({
            title: "Error",
            description: "No se pudo cargar la solicitud",
            variant: "destructive",
          });
          setRequest(null);
          return;
        }
        const typedRequest: ApprovalRequest = {
          id: result.id,
          type: result.type as ApprovalRequestType,
          subject: result.subject,
          description: result.description || "",
          status: result.status as ApprovalStatus,
          requesterId: result.requesterId,
          requesterName: result.requesterName,
          requesterEmail: result.requesterEmail || "",
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          attachments: result.attachments || [],
          activityLog: result.activityLog || [],
          approverId: result.approverId || undefined,
          approverName: result.approverName || undefined,
          approverComment: result.approverComment || undefined,
          approvedAt: result.approvedAt,
          rejectedAt: result.rejectedAt,
          infoRequestedAt: result.infoRequestedAt,
          approvedPaymentType: result.approvedPaymentType || undefined,
          approvedAmount: result.approvedAmount || undefined,
          itemDescription: result.itemDescription || undefined,
          estimatedPrice: result.estimatedPrice || undefined,
          supplierCompra: result.supplierCompra || undefined,
          supplierPago: result.supplierPago || undefined,
          totalAmountToPay: result.totalAmountToPay || undefined,
          paymentInstallments: result.paymentInstallments || [],
        };
        setRequest(typedRequest);
      } catch (err) {
        setError("Error al cargar los detalles de la solicitud");
        console.error("Error loading request details:", err);
        toast({
          title: "Error",
          description: "No se pudieron cargar los detalles de la solicitud",
          variant: "destructive",
        });
        setRequest(null);
      } finally {
        setIsLoading(false);
      }
    }
    if (isOpen && requestId) {
      loadRequestDetails();
    }
  }, [isOpen, requestId, toast]);

  const handleActionSuccess = () => {
    if (onActionSuccess) {
      onActionSuccess();
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Cargando detalles de la solicitud</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !request) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Error al cargar la solicitud</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-4" />
            <p className="text-lg font-semibold text-destructive">{error || "No se pudo cargar la solicitud"}</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderActivityLog = () => {
    if (!request.activityLog || request.activityLog.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-4">
          No hay actividad registrada
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {request.activityLog.map((entry: ApprovalActivityLogEntry) => (
          <div key={entry.id} className="flex items-start gap-3">
            <div className="mt-1">
              {getActivityIcon(entry.action)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{entry.action}</p>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true, locale: es })}
                </span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-1" />
                {entry.userName}
              </div>
              {entry.comment && (
                <p className="text-sm text-muted-foreground mt-1">{entry.comment}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0">
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {request.type === "Compra" ? (
                <ShoppingCart className="h-5 w-5" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              {request.subject}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-6 overflow-y-auto">
          {/* Encabezado */}
          <div className="flex items-start justify-between">
            <div>
              <Badge variant={
                request.status === "Pendiente" ? "default" : 
                request.status === "Aprobado" ? "secondary" : 
                request.status === "Rechazado" ? "destructive" : "outline"
              }>
                {request.status}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Creado {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: es })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Solicitante</p>
              <p className="text-sm text-muted-foreground">{request.requesterName}</p>
            </div>
          </div>

          <Separator />

          {/* Detalles de la solicitud */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Detalles de la Solicitud</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.type === "Compra" ? (
                <>
                  <div>
                    <p className="text-sm font-medium">Descripción del ítem</p>
                    <p className="text-sm text-muted-foreground">{request.itemDescription}</p>
                  </div>
                  {request.estimatedPrice && (
                    <div>
                      <p className="text-sm font-medium">Precio estimado</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(request.estimatedPrice)}</p>
                    </div>
                  )}
                  {request.supplierCompra && (
                    <div>
                      <p className="text-sm font-medium">Proveedor</p>
                      <p className="text-sm text-muted-foreground">{request.supplierCompra}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium">Proveedor</p>
                    <p className="text-sm text-muted-foreground">{request.supplierPago}</p>
                  </div>
                  {request.totalAmountToPay && (
                    <div>
                      <p className="text-sm font-medium">Monto total</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(request.totalAmountToPay)}</p>
                    </div>
                  )}
                  {request.approvedPaymentType && (
                    <div>
                      <p className="text-sm font-medium">Tipo de pago aprobado</p>
                      <p className="text-sm text-muted-foreground">{request.approvedPaymentType}</p>
                    </div>
                  )}
                  {request.approvedAmount && (
                    <div>
                      <p className="text-sm font-medium">Monto aprobado</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(request.approvedAmount)}</p>
                    </div>
                  )}
                  {request.approvedPaymentType === "Cuotas" && request.paymentInstallments && request.paymentInstallments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Cuotas aprobadas</p>
                      <div className="mt-2 space-y-2">
                        {request.paymentInstallments.map((inst, index) => (
                          <div key={inst.id} className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded">
                            <span>Cuota {index + 1}</span>
                            <div className="flex gap-4">
                              <span>{formatCurrency(inst.amount)}</span>
                              <span className="text-muted-foreground">{format(inst.dueDate, "dd/MM/yyyy", { locale: es })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {request.description && (
                <div>
                  <p className="text-sm font-medium">Descripción adicional</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Archivos adjuntos */}
          {request.attachments && request.attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Archivos adjuntos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {request.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Paperclip className="h-4 w-4" />
                      {attachment.fileName}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de actividad */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Historial de actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                {renderActivityLog()}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Panel de acciones */}
          {user && request.status === "Pendiente" && (
            <div className="sticky bottom-0 bg-background border-t pt-4">
              <ApprovalActionsPanel
                requestId={request.id}
                currentRequest={request}
                requestType={request.type}
                onActionSuccess={onActionSuccess || (() => {})}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
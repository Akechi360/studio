
"use client"; 

import { getApprovalRequestDetails } from '@/lib/actions';
import type { ApprovalRequest, ApprovalActivityLogEntry } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, FileText, UserCircle, CalendarDays, Tag, Info, MessageSquare, Paperclip, ShoppingCart, CreditCard, CheckCircle, XCircle, HelpCircle, ListCollapse, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { ApprovalActionsPanel } from '@/components/approvals/approval-actions-panel'; 
import { useAuth } from '@/lib/auth-context';
import { SPECIFIC_APPROVER_EMAILS } from '@/lib/auth-context';
import React, { useEffect, useState, useCallback } from 'react';

const typeDisplayMap: Record<ApprovalRequest["type"], string> = {
  Compra: "Solicitud de Compra",
  PagoProveedor: "Solicitud de Pago a Proveedores",
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
  Pendiente: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-500",
  Aprobado: "bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-500",
  Rechazado: "bg-red-100 text-red-700 border-red-300 dark:bg-red-700/30 dark:text-red-300 dark:border-red-500",
  InformacionSolicitada: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-700/30 dark:text-blue-300 dark:border-blue-500",
};

const DetailRow = ({ label, value, icon: Icon }: { label: string; value?: string | number | null | Date; icon?: React.ElementType }) => {
  if (value === undefined || value === null || value === "") return null;
  
  let displayValue: string | React.ReactNode = '';
  if (value instanceof Date) {
    displayValue = format(value, "PPpp", { locale: es });
  } else {
    displayValue = value.toString();
  }

  return (
    <div className="flex items-start space-x-3 py-2 border-b border-border/20 last:border-b-0">
      {Icon && <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />}
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="text-sm text-foreground mt-0.5">{displayValue}</div>
      </div>
    </div>
  );
};


export default function ApprovalDetailPage() {
  const router = useRouter();
  const pageParams = useParams<{ id: string }>(); 
  const id = pageParams.id; 

  const { user } = useAuth();
  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequestDetails = useCallback(async () => {
    if (!id) { 
      setIsLoading(false);
      setRequest(null); 
      return;
    }
    setIsLoading(true);
    const fetchedRequest = await getApprovalRequestDetails(id); 
    setRequest(fetchedRequest);
    setIsLoading(false);
  }, [id]); 
  
  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]); 

  const handleActionSuccess = () => {
    fetchRequestDetails(); 
    // router.refresh(); // Alternative to re-fetch server-side props if needed, but fetchRequestDetails should update client state.
  };

  const canTakeAction = user && request && (
    user.role === 'Admin' || 
    user.role === 'Presidente IEQ'
  );

  const shouldShowActionsPanel = canTakeAction && request && (request.status === 'Pendiente' || request.status === 'InformacionSolicitada');


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Cargando detalles de la solicitud...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          <AlertTitle className="text-xl font-bold">Solicitud No Encontrada</AlertTitle>
          <AlertDescription className="mb-4">
            La solicitud de aprobación que estás buscando no existe o ha sido eliminada (ID: {id}).
          </AlertDescription>
          <Button asChild variant="outline">
            <Link href="/approvals">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Aprobaciones
            </Link>
          </Button>
        </Alert>
      </div>
    );
  }

  const RequestTypeIcon = typeIconMap[request.type] || FileText;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight flex items-center">
          <RequestTypeIcon className="mr-3 h-7 w-7 text-primary" />
          Detalle de Solicitud: {typeDisplayMap[request.type]}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/approvals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{request.subject}</CardTitle>
            <Badge className={cn("text-sm px-3 py-1", statusColors[request.status])}>
              {statusDisplayMap[request.status]}
            </Badge>
          </div>
          <CardDescription>ID de Solicitud: {request.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailRow label="Solicitante" value={request.requesterName} icon={UserCircle} />
          <DetailRow label="Email Solicitante" value={request.requesterEmail} icon={UserCircle} />
          <DetailRow label="Fecha de Solicitud" value={request.createdAt} icon={CalendarDays} />
          <DetailRow label="Última Actualización" value={request.updatedAt} icon={CalendarDays} />
          
          {request.type === "Compra" && (
            <>
              <DetailRow label="Ítem(s) a Comprar" value={request.itemDescription} icon={ShoppingCart} />
              <DetailRow label="Precio Estimado" value={request.estimatedPrice?.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })} icon={Tag} />
              <DetailRow label="Proveedor Sugerido" value={request.supplierCompra} icon={Info} />
            </>
          )}

          {request.type === "PagoProveedor" && (
            <>
              <DetailRow label="Proveedor" value={request.supplierPago} icon={Info} />
              <DetailRow label="Monto Total a Pagar (Solicitado)" value={request.totalAmountToPay?.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })} icon={Tag} />
               {request.approvedAmount !== undefined && (
                <DetailRow label="Monto Total Aprobado" value={request.approvedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })} icon={Tag} />
              )}
            </>
          )}
          
          {request.description && (
            <div className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center"><MessageSquare className="h-5 w-5 text-primary mr-2 shrink-0"/>Descripción Detallada</h4>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap">{request.description}</p>
            </div>
          )}

          {request.paymentInstallments && request.paymentInstallments.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                <CreditCard className="h-5 w-5 text-primary mr-2 shrink-0" />Cuotas de Pago Aprobadas
              </h4>
              <ul className="list-none p-0 space-y-2">
                {request.paymentInstallments.map(installment => (
                  <li key={installment.id} className="p-2 border rounded-md bg-muted/30 text-sm">
                    Monto: <span className="font-semibold">{installment.amount.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</span> - 
                    Fecha de Vencimiento: <span className="font-semibold">{format(new Date(installment.dueDate), "PPP", { locale: es })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}


          {request.attachments && request.attachments.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center"><Paperclip className="h-5 w-5 text-primary mr-2 shrink-0"/>Archivos Adjuntos</h4>
              <ul className="list-none p-0 space-y-1">
                {request.attachments.map(att => (
                  <li key={att.id}>
                    <Button variant="link" asChild className="p-0 h-auto text-sm">
                      <a href={att.url} target="_blank" rel="noopener noreferrer" data-ai-hint="descarga archivo">
                        <Paperclip className="mr-1.5 h-4 w-4" />{att.fileName} ({(att.size / 1024).toFixed(1)} KB)
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center"><ListCollapse className="mr-2 h-5 w-5 text-primary"/>Historial de Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          {request.activityLog && request.activityLog.length > 0 ? (
            <ul className="space-y-3">
              {request.activityLog.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => (
                <li key={log.id} className="p-3 border rounded-md bg-muted/20 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-primary">{log.action}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(log.timestamp), "PPpp", { locale: es })}</span>
                  </div>
                  <p className="text-muted-foreground">Por: {log.userName}</p>
                  {log.comment && <p className="mt-1 italic text-foreground/80">Comentario: "{log.comment}"</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No hay actividad registrada para esta solicitud.</p>
          )}
        </CardContent>
      </Card>
      
      {shouldShowActionsPanel && request && (
          <ApprovalActionsPanel
            key={request.id} 
            requestId={request.id}
            currentRequest={request} 
            requestType={request.type}
            onActionSuccess={handleActionSuccess}
          />
      )}
    </div>
  );
}

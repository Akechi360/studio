
import { getApprovalRequestDetails } from '@/lib/actions';
import type { ApprovalRequest } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, FileText, UserCircle, CalendarDays, Tag, Info, MessageSquare, Paperclip, ShoppingCart, CreditCard, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
// Placeholder for future approval actions component
// import { ApprovalActionsPanel } from '@/components/approvals/approval-actions-panel'; 


interface ApprovalDetailPageProps {
  params: { id: string };
}

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


export default async function ApprovalDetailPage({ params }: ApprovalDetailPageProps) {
  const request = await getApprovalRequestDetails(params.id);

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          <AlertTitle className="text-xl font-bold">Solicitud No Encontrada</AlertTitle>
          <AlertDescription className="mb-4">
            La solicitud de aprobación que estás buscando no existe o ha sido eliminada.
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
              <DetailRow label="Monto Total a Pagar" value={request.totalAmountToPay?.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })} icon={Tag} />
            </>
          )}
          
          {request.description && (
            <div className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center"><MessageSquare className="h-5 w-5 text-primary mr-2 shrink-0"/>Descripción Detallada</h4>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap">{request.description}</p>
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

      {/* Placeholder for Activity Log */}
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center"><HelpCircle className="mr-2 h-5 w-5 text-primary"/>Historial de Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">El historial de actividad para esta solicitud se mostrará aquí.</p>
          {/* TODO: Implement activity log rendering */}
        </CardContent>
      </Card>
      
      {/* Placeholder for Approval Actions Panel */}
      {request.status === 'Pendiente' && (
          <Card className="w-full shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center"><CheckCircle className="mr-2 h-5 w-5 text-primary"/>Tomar Acción</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Las acciones para aprobar, rechazar o solicitar más información se mostrarán aquí.</p>
                {/* <ApprovalActionsPanel requestId={request.id} requestType={request.type} currentRequest={request} /> */}
            </CardContent>
          </Card>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: ApprovalDetailPageProps) {
  const request = await getApprovalRequestDetails(params.id);
  if (!request) {
    return { title: "Solicitud No Encontrada" };
  }
  return {
    title: `Solicitud #${request.id}: ${request.subject}`,
    description: `Detalles de la solicitud de aprobación ${request.subject.substring(0, 100)}...`,
  };
}

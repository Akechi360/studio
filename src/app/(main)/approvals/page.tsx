
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck, ShoppingCart, CreditCard, ShieldAlert, ListChecks, Loader2 } from "lucide-react"; // Added Loader2
import { useAuth, SPECIFIC_APPROVER_EMAILS } from '@/lib/auth-context';
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { ApprovalRequest } from "@/lib/types";
import { CreatePurchaseRequestDialog } from "@/components/approvals/CreatePurchaseRequestDialog";
import { CreatePaymentRequestDialog } from "@/components/approvals/CreatePaymentRequestDialog"; 
import { getApprovalRequestsForUser } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";

function AccessDeniedMessage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <Alert variant="destructive" className="max-w-md text-center shadow-lg">
        <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
        <RadixAlertTitle className="text-xl font-bold">Acceso Denegado</RadixAlertTitle>
        <AlertDescription className="mb-4">
          No tienes permiso para acceder a la sección de Aprobaciones.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [submittedRequests, setSubmittedRequests] = useState<ApprovalRequest[]>([]);
  const [isLoadingPresidente, setIsLoadingPresidente] = useState(false);
  const [isLoadingSubmitted, setIsLoadingSubmitted] = useState(false);
  const [isCreatePurchaseDialogOpen, setIsCreatePurchaseDialogOpen] = useState(false);
  const [isCreatePaymentDialogOpen, setIsCreatePaymentDialogOpen] = useState(false);

  const canAccessApprovals =
    user?.role === "Admin" ||
    user?.role === "Presidente IEQ" ||
    (user?.email ? SPECIFIC_APPROVER_EMAILS.includes(user.email) : false);

  const fetchPresidenteRequests = async () => {
    if (user?.role === "Presidente IEQ" && user.id) {
      setIsLoadingPresidente(true);
      const requests = await getApprovalRequestsForUser(user.id, user.role);
      setPendingApprovals(requests);
      setIsLoadingPresidente(false);
    } else {
      setPendingApprovals([]); 
      setIsLoadingPresidente(false);
    }
  };
  
  const fetchSubmittedRequests = async () => {
    if (user && user.id && user.role && (user.role === "Admin" || SPECIFIC_APPROVER_EMAILS.includes(user.email)) && user.role !== "Presidente IEQ") {
      setIsLoadingSubmitted(true);
      const requests = await getApprovalRequestsForUser(user.id, user.role);
      setSubmittedRequests(requests);
      setIsLoadingSubmitted(false);
    } else {
      setSubmittedRequests([]);
      setIsLoadingSubmitted(false);
    }
  };


  useEffect(() => {
    if (!canAccessApprovals) {
        setPendingApprovals([]);
        setSubmittedRequests([]);
        setIsLoadingPresidente(false);
        setIsLoadingSubmitted(false);
        return;
    }

    if (user?.role === "Presidente IEQ") {
        fetchPresidenteRequests();
        setSubmittedRequests([]); // President doesn't see "submitted by them" here
    } else if (user && (user.role === "Admin" || SPECIFIC_APPROVER_EMAILS.includes(user.email))) {
        fetchSubmittedRequests();
        setPendingApprovals([]); // Admins/Approvers don't see "pending for president" here
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, canAccessApprovals]);


  if (!canAccessApprovals) {
    return <AccessDeniedMessage />;
  }

  const handleNewPurchaseRequest = () => {
    setIsCreatePurchaseDialogOpen(true);
  };

  const handleNewPaymentRequest = () => {
    setIsCreatePaymentDialogOpen(true); 
  };

  const handleRequestSuccess = async (approvalId: string) => {
    console.log("Request created successfully with ID:", approvalId);
    if (user?.role === "Presidente IEQ") {
        fetchPresidenteRequests();
    } else if (user && (user.role === "Admin" || SPECIFIC_APPROVER_EMAILS.includes(user.email))) {
        fetchSubmittedRequests();
    }
    setIsCreatePurchaseDialogOpen(false);
    setIsCreatePaymentDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <FileCheck className="mr-3 h-8 w-8 text-primary" />
            Aprobaciones
          </h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza las solicitudes pendientes de aprobación.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button onClick={handleNewPurchaseRequest} size="lg" className="shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Compras
            </Button>
            <Button onClick={handleNewPaymentRequest} size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
                <CreditCard className="mr-2 h-5 w-5" />
                Pago a Proveedores
            </Button>
        </div>
      </div>

      {user?.role === "Presidente IEQ" && (
        <Card className="shadow-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
                <ListChecks className="mr-2 h-6 w-6 text-primary" />
                Mis Solicitudes Pendientes de Aprobación
            </CardTitle>
            <CardDescription>
              Aquí se listarán las solicitudes que requieren tu acción.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPresidente ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
                <span>Cargando solicitudes...</span>
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-center py-10">
                <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-semibold">No tienes solicitudes pendientes de aprobación en este momento.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {pendingApprovals.map(req => (
                    <li key={req.id} className="p-4 border rounded-md shadow-sm hover:shadow-md transition-shadow bg-muted/20">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-primary">{req.subject}</h3>
                            <Badge variant={req.type === "Compra" ? "default" : "secondary"}>{req.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Solicitante: {req.requesterName}</p>
                        <p className="text-sm text-muted-foreground">Fecha: {new Date(req.createdAt).toLocaleDateString('es-ES')}</p>
                        {req.type === "Compra" && req.estimatedPrice && (
                            <p className="text-sm text-muted-foreground">Monto Est.: {req.estimatedPrice.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</p>
                        )}
                        {req.type === "PagoProveedor" && req.totalAmountToPay && (
                            <p className="text-sm text-muted-foreground">Monto a Pagar: {req.totalAmountToPay.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</p>
                        )}
                        <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-primary" onClick={() => toast({title: "Funcionalidad en Desarrollo", description: `Ver detalles para ${req.id} aún no está implementado.`})}>
                            Ver Detalles
                        </Button>
                    </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

       {(user?.role === "Admin" || (user?.email && SPECIFIC_APPROVER_EMAILS.includes(user.email))) && user.role !== "Presidente IEQ" && (
         <Card className="shadow-lg w-full">
           <CardHeader>
             <CardTitle className="flex items-center">
                <ListChecks className="mr-2 h-6 w-6 text-primary" />
                Mis Solicitudes Enviadas
             </CardTitle>
             <CardDescription>Visualiza el estado de las solicitudes que has creado.</CardDescription>
           </CardHeader>
           <CardContent>
            {isLoadingSubmitted ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
                    <span>Cargando tus solicitudes enviadas...</span>
                </div>
            ) : submittedRequests.length === 0 ? (
                <div className="text-center py-10">
                    <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="font-semibold">No has enviado ninguna solicitud aún.</p>
                    <p className="text-sm text-muted-foreground">Utiliza los botones de "Compras" o "Pago a Proveedores" para crear una nueva.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {submittedRequests.map(req => (
                        <li key={req.id} className="p-4 border rounded-md shadow-sm hover:shadow-md transition-shadow bg-muted/20">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-primary">{req.subject}</h3>
                                <div className="flex items-center gap-2">
                                    <Badge variant={req.status === "Aprobado" ? "default" : (req.status === "Rechazado" ? "destructive" : "secondary")}
                                        className={req.status === "Aprobado" ? "bg-green-500 text-white" : ""}
                                    >
                                        {req.status}
                                    </Badge>
                                    <Badge variant={req.type === "Compra" ? "outline" : "secondary"}>{req.type}</Badge>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Fecha Solicitud: {new Date(req.createdAt).toLocaleDateString('es-ES')}</p>
                            <p className="text-sm text-muted-foreground">Última Actualización: {new Date(req.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                             {req.type === "Compra" && req.estimatedPrice && (
                                <p className="text-sm text-muted-foreground">Monto Est.: {req.estimatedPrice.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</p>
                            )}
                            {req.type === "PagoProveedor" && req.totalAmountToPay && (
                                <p className="text-sm text-muted-foreground">Monto a Pagar: {req.totalAmountToPay.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}</p>
                            )}
                            <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-primary" onClick={() => toast({title: "Funcionalidad en Desarrollo", description: `Ver detalles para ${req.id} aún no está implementado.`})}>
                                Ver Detalles
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
           </CardContent>
         </Card>
       )}
      <CreatePurchaseRequestDialog
        isOpen={isCreatePurchaseDialogOpen}
        onClose={() => setIsCreatePurchaseDialogOpen(false)}
        onSuccess={handleRequestSuccess}
      />
      <CreatePaymentRequestDialog
        isOpen={isCreatePaymentDialogOpen}
        onClose={() => setIsCreatePaymentDialogOpen(false)}
        onSuccess={handleRequestSuccess} 
      />
    </div>
  );
}

    
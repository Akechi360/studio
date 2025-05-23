
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck, ShoppingCart, CreditCard, ShieldAlert, ListChecks } from "lucide-react";
import { useAuth, SPECIFIC_APPROVER_EMAILS } from '@/lib/auth-context';
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast"; // For placeholder button actions
import { useEffect, useState } from "react";
import type { ApprovalRequest } from "@/lib/types"; // Placeholder for when we list requests
// import { getApprovalRequestsForUser } from "@/lib/actions"; // Placeholder

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
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]); // Placeholder
  const [isLoading, setIsLoading] = useState(false); // Placeholder

  const canAccessApprovals =
    user?.role === "Admin" ||
    user?.role === "Presidente IEQ" ||
    (user?.email ? SPECIFIC_APPROVER_EMAILS.includes(user.email) : false);

  // Placeholder: useEffect to fetch approvals if user is Presidente IEQ
  useEffect(() => {
    if (user?.role === "Presidente IEQ") {
      setIsLoading(true);
      // const fetchRequests = async () => {
      //   const requests = await getApprovalRequestsForUser(user.id, user.role);
      //   setPendingApprovals(requests);
      //   setIsLoading(false);
      // };
      // fetchRequests();
      // For now, just simulate loading and empty state
      setTimeout(() => {
        setPendingApprovals([]);
        setIsLoading(false);
      }, 500);
    }
  }, [user]);


  if (!canAccessApprovals) {
    return <AccessDeniedMessage />;
  }

  const handleNewPurchaseRequest = () => {
    toast({
      title: "Nueva Solicitud de Compra",
      description: "El formulario para crear solicitudes de compra aún no está implementado.",
    });
    // Here you would open a modal or navigate to a form page
  };

  const handleNewPaymentRequest = () => {
    toast({
      title: "Nueva Solicitud de Pago a Proveedores",
      description: "El formulario para crear solicitudes de pago aún no está implementado.",
    });
    // Here you would open a modal or navigate to a form page
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
                Nueva Solicitud de Compra
            </Button>
            <Button onClick={handleNewPaymentRequest} size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
                <CreditCard className="mr-2 h-5 w-5" />
                Nueva Solicitud de Pago
            </Button>
        </div>
      </div>

      {/* Section for Presidente IEQ to view their pending approvals */}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Cargando solicitudes...</span>
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-center py-10">
                <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-semibold">No tienes solicitudes pendientes de aprobación en este momento.</p>
              </div>
            ) : (
              <div className="text-center py-10">
                {/* Placeholder: Table/List of approval requests will go here */}
                <p className="text-muted-foreground">(Aquí se mostrará la tabla de solicitudes pendientes)</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

       {/* Placeholder for other users who can access approvals but are not "Presidente IEQ" */}
       {(user?.role === "Admin" || (user?.email && SPECIFIC_APPROVER_EMAILS.includes(user.email))) && user.role !== "Presidente IEQ" && (
         <Card className="shadow-lg w-full">
           <CardHeader>
             <CardTitle>Mis Solicitudes Enviadas</CardTitle>
             <CardDescription>Visualiza el estado de las solicitudes que has creado.</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="text-center py-10">
                <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-semibold">Funcionalidad en desarrollo.</p>
                <p className="text-sm text-muted-foreground">Aquí podrás ver tus solicitudes enviadas.</p>
             </div>
           </CardContent>
         </Card>
       )}
    </div>
  );
}

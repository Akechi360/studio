// src/app/(main)/approvals/page.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck, ShoppingCart, CreditCard, ShieldAlert, ListChecks, Loader2, Printer } from "lucide-react"; // Added Printer icon
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from '@/components/ui/alert';
import { getApprovalRequestsForUser, getApprovalRequestById } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { notFound } from "next/navigation";

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

export default async function ApprovalsPage() {
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
            <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Compras
            </Button>
            <Button size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
                <CreditCard className="mr-2 h-5 w-5" />
                Pago a Proveedores
            </Button>
            {/* Botón de Imprimir */}
            <Button size="lg" variant="secondary" className="shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
                <Printer className="mr-2 h-5 w-5" />
                Imprimir
            </Button>
        </div>
      </div>

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
          {/* Implementation of the loading state and empty state */}
        </CardContent>
      </Card>

      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
             <ListChecks className="mr-2 h-6 w-6 text-primary" />
             Mis Solicitudes Enviadas
          </CardTitle>
          <CardDescription>Visualiza el estado de las solicitudes que has creado.</CardDescription>
        </CardHeader>
        <CardContent>
         {/* Implementation of the loading state and empty state */}
        </CardContent>
      </Card>
    </div>
  );
}

export async function ApprovalDetailPage({ params }: { params: { id: string } }) {
  const approval = await getApprovalRequestById(params.id);

  if (!approval) return notFound();

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Detalle de Solicitud de Aprobación</h1>
      <p><b>ID:</b> {approval.displayId}</p>
      <p><b>Asunto:</b> {approval.subject}</p>
      <p><b>Tipo:</b> {approval.type}</p>
      <p><b>Estado:</b> {approval.status}</p>
      <p><b>Solicitante:</b> {approval.requesterName}</p>
      <p><b>Fecha de creación:</b> {new Date(approval.createdAt).toLocaleString('es-ES')}</p>
      <p><b>Descripción:</b> {approval.description}</p>
      {/* Agrega aquí más campos según tu modelo */}
    </div>
  );
}
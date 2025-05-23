
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileCheck, Construction } from "lucide-react";

export default function ApprovalsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <FileCheck className="mr-3 h-8 w-8 text-primary" />
          Aprobaciones
        </h1>
        <p className="text-muted-foreground">
          Gestiona y visualiza las solicitudes pendientes de aprobación.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Sistema de Aprobaciones</CardTitle>
          <CardDescription>Este módulo permitirá gestionar diferentes tipos de aprobaciones dentro de la organización.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center min-h-[300px]">
            <Construction className="mx-auto h-16 w-16 text-primary/70 mb-4" />
            <h3 className="mt-4 text-xl font-semibold">
              Módulo en Desarrollo
            </h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              La funcionalidad para gestionar aprobaciones se implementará próximamente.
              <br />
              Aquí podrás ver solicitudes de compra, permisos, y otros flujos que requieran aprobación.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

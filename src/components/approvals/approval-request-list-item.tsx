
"use client";

import type { ApprovalRequest } from "@/lib/types";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, FileCheck, ShoppingCart, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovalRequestListItemProps {
  request: ApprovalRequest;
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


export function ApprovalRequestListItem({ request }: ApprovalRequestListItemProps) {
  const TypeIcon = typeIconMap[request.type] || FileCheck;

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold leading-tight">
            <Link href={`/approvals/${request.id}`} className="hover:underline text-primary flex items-center">
              <TypeIcon className="mr-2 h-5 w-5 shrink-0" />
              {request.subject}
            </Link>
          </CardTitle>
          <Badge className={cn("text-xs text-white whitespace-nowrap", statusColors[request.status])}>
            {statusDisplayMap[request.status]}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {typeDisplayMap[request.type]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow">
        <p className="text-sm">
          <span className="font-medium text-muted-foreground">Solicitante:</span> {request.requesterName}
        </p>
        {request.type === "Compra" && request.estimatedPrice && (
          <p className="text-sm">
            <span className="font-medium text-muted-foreground">Monto Est.:</span> {request.estimatedPrice.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}
          </p>
        )}
        {request.type === "PagoProveedor" && request.totalAmountToPay && (
           <p className="text-sm">
            <span className="font-medium text-muted-foreground">Monto a Pagar:</span> {request.totalAmountToPay.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}
          </p>
        )}
        <p className="text-sm text-foreground/80 line-clamp-2">
          {request.description || "Sin descripción adicional."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-4">
        <time dateTime={new Date(request.createdAt).toISOString()} title={format(new Date(request.createdAt), "PPPppp", { locale: es })}>
          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: es })}
        </time>
        <Link href={`/approvals/${request.id}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          Ver Detalles <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}


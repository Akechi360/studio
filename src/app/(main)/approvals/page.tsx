// src/app/(main)/approvals/page.tsx
"use client";

import { useState } from 'react';
import { getApprovalRequestsForUser } from '@/lib/actions';
import { ApprovalRequestListItem } from '@/components/approvals/approval-request-list-item';
import { ApprovalDetailsModal } from '@/components/approvals/ApprovalDetailsModal';
import { CreatePurchaseRequestDialog } from '@/components/approvals/CreatePurchaseRequestDialog';
import { CreatePaymentRequestDialog } from '@/components/approvals/CreatePaymentRequestDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ShoppingCart, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';
import type { ApprovalRequest } from '@/lib/types';

export default function ApprovalsPage() {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [submittedRequests, setSubmittedRequests] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatePurchaseOpen, setIsCreatePurchaseOpen] = useState(false);
  const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const requests = await getApprovalRequestsForUser(user.id, user.role);
      
      if (user.role === "Presidente") {
        setPendingApprovals(requests);
        setSubmittedRequests([]);
      } else {
        setSubmittedRequests(requests);
        setPendingApprovals([]);
      }
    } catch (error) {
      toast({
        title: "Error al cargar solicitudes",
        description: "Ocurrió un error al cargar los datos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleViewDetails = (requestId: string) => {
    setSelectedRequestId(requestId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRequestId(null);
  };

  const handleActionSuccess = () => {
    loadData();
  };

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8 text-muted-foreground">
          Debes iniciar sesión para acceder a esta sección.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Aprobaciones</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreatePurchaseOpen(true)}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Nueva Compra
          </Button>
          <Button onClick={() => setIsCreatePaymentOpen(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Nuevo Pago
          </Button>
        </div>
      </div>

      <Tabs defaultValue={user.role === "Presidente" ? "pending" : "submitted"} className="w-full">
        <TabsList>
          {user.role === "Presidente" && (
            <TabsTrigger value="pending">Pendientes de Aprobación</TabsTrigger>
          )}
          <TabsTrigger value="submitted">Mis Solicitudes</TabsTrigger>
        </TabsList>

        {user.role === "Presidente" && (
          <TabsContent value="pending" className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">Cargando aprobaciones pendientes...</div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay solicitudes pendientes de aprobación
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingApprovals.map((request) => (
                  <ApprovalRequestListItem
                    key={request.id}
                    request={request}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="submitted" className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">Cargando solicitudes enviadas...</div>
          ) : submittedRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No has enviado ninguna solicitud
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submittedRequests.map((request) => (
                <ApprovalRequestListItem
                  key={request.id}
                  request={request}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreatePurchaseRequestDialog
        isOpen={isCreatePurchaseOpen}
        onClose={() => setIsCreatePurchaseOpen(false)}
        onSuccess={handleActionSuccess}
      />

      <CreatePaymentRequestDialog
        isOpen={isCreatePaymentOpen}
        onClose={() => setIsCreatePaymentOpen(false)}
        onSuccess={handleActionSuccess}
      />

      <ApprovalDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        requestId={selectedRequestId}
        onActionSuccess={handleActionSuccess}
      />
    </div>
  );
}



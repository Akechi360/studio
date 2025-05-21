
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Archive, PlusCircle, Loader2, Pencil, Trash2, Eye, ShieldAlert } from "lucide-react";
import React, { useState, useEffect, useCallback } from 'react';
import { getAllInventoryItems, deleteInventoryItemAction } from "@/lib/actions";
import type { InventoryItem } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { EditItemDialog } from '@/components/inventory/edit-item-dialog';
import { DeleteItemDialog } from '@/components/inventory/delete-item-dialog';
import { ViewItemDetailsDialog } from '@/components/inventory/view-item-details-dialog';
import { InventoryFilters } from '@/components/inventory/inventory-filters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from '@/components/ui/alert';

const getInitialsForItem = (name: string) => {
  if (!name) return '??';
  return name.substring(0, 2).toUpperCase();
};

const statusColors: Record<InventoryItem["status"], string> = {
  "En Uso": "bg-green-500 text-green-50",
  "En Almacen": "bg-blue-500 text-blue-50",
  "En Reparacion": "bg-yellow-500 text-yellow-50",
  "De Baja": "bg-red-500 text-red-50",
  "Perdido": "bg-gray-500 text-gray-50",
};


export default function InventoryPage() {
  const { user, role, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogVisible, setIsAddDialogVisible] = useState(false);
  
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<InventoryItem | null>(null);
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<InventoryItem | null>(null);
  const [isConfirmDeleteDialogVisible, setIsConfirmDeleteDialogVisible] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const [selectedItemForView, setSelectedItemForView] = useState<InventoryItem | null>(null);
  const [isViewDetailsDialogVisible, setIsViewDetailsDialogVisible] = useState(false);

  const [currentFilters, setCurrentFilters] = useState<{ category: string; location: string }>({ category: "all", location: "all" });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const inventoryItems = await getAllInventoryItems();
    setAllItems(inventoryItems);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (role === "Admin") {
      fetchItems();
    }
  }, [fetchItems, role]);

  useEffect(() => {
    let itemsToFilter = [...allItems];
    if (currentFilters.category !== "all") {
      itemsToFilter = itemsToFilter.filter(item => item.category === currentFilters.category);
    }
    if (currentFilters.location !== "all") {
      itemsToFilter = itemsToFilter.filter(item => item.location === currentFilters.location);
    }
    setFilteredItems(itemsToFilter);
  }, [allItems, currentFilters]);
  
  const handleItemAddedOrUpdated = () => {
    fetchItems(); 
    setIsAddDialogVisible(false);
    setIsEditDialogVisible(false);
  };

  const handleFilterChange = (filters: { category: string; location: string }) => {
    setCurrentFilters(filters);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItemForEdit(item);
    setIsEditDialogVisible(true);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    setSelectedItemForDelete(item);
    setIsConfirmDeleteDialogVisible(true);
  };

  const confirmDeleteItem = async () => {
    if (!selectedItemForDelete) return;
    setIsDeletingItem(true);
    const result = await deleteInventoryItemAction(selectedItemForDelete.id);
    setIsDeletingItem(false);
    setIsConfirmDeleteDialogVisible(false);

    if (result.success) {
      toast({ title: "Artículo Eliminado", description: result.message });
      fetchItems(); 
    } else {
      toast({ title: "Fallo al Eliminar", description: result.message, variant: "destructive" });
    }
    setSelectedItemForDelete(null);
  };

  const handleViewItemDetails = (item: InventoryItem) => {
    setSelectedItemForView(item);
    setIsViewDetailsDialogVisible(true);
  };

  const handleCloseViewDetailsDialog = () => {
    setSelectedItemForView(null);
    setIsViewDetailsDialogVisible(false);
  };

  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <ShieldAlert className="h-8 w-8 mx-auto mb-3 text-destructive" />
          <RadixAlertTitle className="text-xl font-bold">Acceso Denegado</RadixAlertTitle>
          <AlertDescription className="mb-4">
            No tienes permiso para acceder al Inventario. Esta área está restringida a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Archive className="mr-3 h-8 w-8 text-primary" />
            Inventario de la Clínica
          </h1>
          <p className="text-muted-foreground">
            Gestiona los activos y periféricos de la clínica.
          </p>
        </div>
        {user && (
            <Button onClick={() => setIsAddDialogVisible(true)} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
            <PlusCircle className="mr-2 h-5 w-5" />
            Añadir Nuevo Artículo
            </Button>
        )}
      </div>

      <InventoryFilters allItems={allItems} onFilterChange={handleFilterChange} />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Artículos</CardTitle>
          <CardDescription>Visualiza los artículos del inventario según los filtros aplicados. Haz clic en el nombre para ver detalles.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              Cargando artículos del inventario...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">
                {allItems.length === 0 ? "Inventario Vacío" : "No Se Encontraron Artículos"}
              </h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                {allItems.length === 0 
                  ? "Aún no se han añadido artículos al inventario."
                  : "No hay artículos que coincidan con tus filtros actuales."
                }
              </p>
              {user && allItems.length === 0 && (
                 <Button onClick={() => setIsAddDialogVisible(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añade Tu Primer Artículo
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>N/S</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 hidden sm:flex">
                          <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitialsForItem(item.name)}`} alt={item.name} data-ai-hint="item activo" />
                          <AvatarFallback>{getInitialsForItem(item.name)}</AvatarFallback>
                        </Avatar>
                        <Button 
                            variant="link" 
                            className="font-medium p-0 h-auto hover:underline text-foreground text-left"
                            onClick={() => handleViewItemDetails(item)}
                            title={`Ver detalles de ${item.name}`}
                        >
                            {item.name}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.brand || <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell>{item.model || <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell>{item.serialNumber || <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${statusColors[item.status]} border-none`}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.location || <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar Artículo</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar Artículo</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleDeleteItem(item)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar Artículo</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eliminar Artículo</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {user && (
        <AddItemDialog 
          isOpen={isAddDialogVisible} 
          onClose={() => setIsAddDialogVisible(false)} 
          onItemAdded={handleItemAddedOrUpdated}
          currentUser={user}
        /> 
      )}

      {selectedItemForEdit && user && (
        <EditItemDialog
          itemToEdit={selectedItemForEdit}
          isOpen={isEditDialogVisible}
          onClose={() => { setIsEditDialogVisible(false); setSelectedItemForEdit(null); }}
          onItemUpdated={handleItemAddedOrUpdated}
        />
      )}

      {selectedItemForDelete && (
        <DeleteItemDialog
          isOpen={isConfirmDeleteDialogVisible}
          onClose={() => { setIsConfirmDeleteDialogVisible(false); setSelectedItemForDelete(null); }}
          onConfirm={confirmDeleteItem}
          itemName={selectedItemForDelete.name}
          isDeleting={isDeletingItem}
        />
      )}

      {selectedItemForView && (
        <ViewItemDetailsDialog
            item={selectedItemForView}
            isOpen={isViewDetailsDialogVisible}
            onClose={handleCloseViewDetailsDialog}
        />
      )}
    </div>
    </TooltipProvider>
  );
}

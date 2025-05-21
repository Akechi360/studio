
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Archive, PlusCircle, Loader2 } from "lucide-react";
import React, { useState, useEffect, useCallback } from 'react';
import { getAllInventoryItems } from "@/lib/actions";
import type { InventoryItem } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { InventoryFilters } from '@/components/inventory/inventory-filters'; // Importar filtros

export default function InventoryPage() {
  const { user } = useAuth();
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogVisible, setIsAddDialogVisible] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<{ category: string; location: string }>({ category: "all", location: "all" });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const inventoryItems = await getAllInventoryItems();
    setAllItems(inventoryItems);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
  
  const handleItemAdded = () => {
    fetchItems(); 
    setIsAddDialogVisible(false);
  };

  const handleFilterChange = (filters: { category: string; location: string }) => {
    setCurrentFilters(filters);
  };

  return (
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
          <CardDescription>Visualiza los artículos del inventario según los filtros aplicados.</CardDescription>
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
            <div>
              {/* Aquí se renderizará la tabla de artículos del inventario */}
              <p className="text-center text-muted-foreground py-8">
                La tabla de artículos del inventario se mostrará aquí. ({filteredItems.length} artículo(s) encontrado(s) de {allItems.length} total(es))
              </p>
              {/* 
                Ejemplo de cómo se podría iterar (la tabla real será más compleja):
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <Card key={item.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{item.name}</CardTitle>
                      <CardDescription>{item.category} - {item.brand || ''} {item.model || ''}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm">Serial: {item.serialNumber || 'N/A'}</p>
                      <p className="text-sm">Cantidad: {item.quantity}</p>
                      <p className="text-sm">Estado: {item.status}</p>
                      {item.location && <p className="text-sm">Ubicación: {item.location}</p>}
                    </CardContent>
                    <CardFooter>
                       <Button variant="outline" size="sm">Ver Detalles</Button> 
                    </CardFooter>
                  </Card>
                ))}
                </div>
              */}
            </div>
          )}
        </CardContent>
      </Card>
      
      {user && (
        <AddItemDialog 
          isOpen={isAddDialogVisible} 
          onClose={() => setIsAddDialogVisible(false)} 
          onItemAdded={handleItemAdded}
          currentUser={user}
        /> 
      )}
    </div>
  );
}


"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Archive, PlusCircle, Search } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { getAllInventoryItems } from "@/lib/actions";
import type { InventoryItem } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
// Importa los componentes necesarios para el diálogo y formulario más adelante
// import { AddItemDialog } from '@/components/inventory/add-item-dialog'; 

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogVisible, setIsAddDialogVisible] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      const inventoryItems = await getAllInventoryItems();
      setItems(inventoryItems);
      setIsLoading(false);
    };
    fetchItems();
  }, []);
  
  // Función para manejar la adición de un nuevo artículo (se conectará al diálogo más adelante)
  const handleItemAdded = async () => {
    setIsLoading(true);
    const inventoryItems = await getAllInventoryItems();
    setItems(inventoryItems);
    setIsLoading(false);
    setIsAddDialogVisible(false); // Cierra el diálogo después de añadir
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
        <Button onClick={() => setIsAddDialogVisible(true)} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
          <PlusCircle className="mr-2 h-5 w-5" />
          Añadir Nuevo Artículo
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Artículos</CardTitle>
          <CardDescription>Busca y visualiza los artículos del inventario.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Input id="search-inventory" placeholder="Buscar por nombre, serial, marca..." className="pl-10" />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {/* Aquí se añadirán filtros más avanzados si es necesario */}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Archive className="h-12 w-12 animate-pulse text-muted-foreground" />
              <p className="ml-3 text-muted-foreground">Cargando artículos del inventario...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">Inventario Vacío</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Aún no se han añadido artículos al inventario.
              </p>
              <Button onClick={() => setIsAddDialogVisible(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añade Tu Primer Artículo
              </Button>
            </div>
          ) : (
            <div>
              {/* Aquí se renderizará la tabla de artículos del inventario */}
              <p className="text-center text-muted-foreground py-8">
                La tabla de artículos del inventario se mostrará aquí. ({items.length} artículos encontrados)
              </p>
              {/* 
                Ejemplo de cómo se podría iterar (la tabla real será más compleja):
                {items.map(item => (
                  <div key={item.id} className="p-2 border-b">
                    {item.name} ({item.category}) - {item.serialNumber || 'N/A'}
                  </div>
                ))}
              */}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 
        El diálogo para añadir artículos se implementará en un paso posterior.
        Si isAddDialogVisible es true, se mostraría:
        <AddItemDialog 
          isOpen={isAddDialogVisible} 
          onClose={() => setIsAddDialogVisible(false)} 
          onItemAdded={handleItemAdded}
          currentUser={user} // Necesitaremos pasar el usuario actual
        /> 
      */}
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // <--- CORRECCIÓN CLAVE AQUÍ: Eliminado el '=>'
import { Label } from "@/components/ui/label";
import { Archive, PlusCircle, Loader2, Pencil, Trash2, Eye, ShieldAlert, UploadCloud, Info } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { getAllInventoryItems, deleteInventoryItemAction, importInventoryItemsAction } from "@/lib/actions";
import type { InventoryItem, ExcelInventoryItemData, InventoryItemCategory, InventoryItemStatus, RamOption, StorageType } from "@/lib/types"; // Importar tipos necesarios
import { useAuth } from "@/lib/auth-context";
import { AddItemDialog } from '@/components/inventory/add-item-dialog';
import { EditItemDialog } from '@/components/inventory/edit-item-dialog';
import { DeleteItemDialog } from '@/components/inventory/delete-item-dialog';
import { ViewItemDetailsDialog } from '@/components/inventory/view-item-details-dialog';
import { InventoryFilters } from '@/components/inventory/inventory-filters'; // Si este componente se usa
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast"; // Importar useToast
import { Alert, AlertDescription, AlertTitle as RadixAlertTitle } from '@/components/ui/alert';
import * as XLSX from 'xlsx';

const getInitialsForItem = (name: string) => {
  if (!name) return '??';
  return name.substring(0, 2).toUpperCase();
};

// Mapas de visualización para todos los enums de inventario
const CATEGORY_DISPLAY_MAP: Record<InventoryItemCategory, string> = {
  "Computadora": "Computadora",
  "Monitor": "Monitor",
  "Teclado": "Teclado",
  "Mouse": "Mouse",
  "Impresora": "Impresora",
  "Escaner": "Escáner", // Añadido acento
  "Router": "Router",
  "Switch": "Switch",
  "Servidor": "Servidor",
  "Laptop": "Laptop",
  "Tablet": "Tablet",
  "Proyector": "Proyector",
  "TelefonoIP": "Teléfono IP", // Clave sin espacio, valor con espacio
  "OtroPeriferico": "Otro Periférico", // Clave sin espacio, valor con espacio
  "Software": "Software",
  "Licencia": "Licencia",
  "Otro": "Otro",
};

const STATUS_DISPLAY_MAP: Record<InventoryItemStatus, string> = {
  "EnUso": "En Uso", // Clave sin espacio, valor con espacio
  "EnAlmacen": "En Almacén", // Clave sin espacio, valor con espacio
  "EnReparacion": "En Reparación", // Clave sin espacio, valor con espacio
  "DeBaja": "De Baja", // Clave sin espacio, valor con espacio
  "Perdido": "Perdido", // Clave sin espacio, valor con espacio
};

const RAM_DISPLAY_MAP: Record<RamOption, string> = {
  "NoEspecificado": "No Especificado", // Clave sin espacio, valor con espacio
  "RAM_2GB": "2GB", // Clave sin espacio, valor con espacio
  "RAM_4GB": "4GB",
  "RAM_8GB": "8GB",
  "RAM_12GB": "12GB",
  "RAM_16GB": "16GB",
  "RAM_32GB": "32GB",
  "RAM_64GB": "64GB",
  "Otro": "Otro",
};

const STORAGE_DISPLAY_MAP: Record<StorageType, string> = {
  "HDD": "HDD",
  "SSD": "SSD",
  "NoEspecificado": "No Especificado", // Clave sin espacio, valor con espacio
};


// Mapeo de colores de estado (mantener si es necesario, o usar una función que devuelva la clase Tailwind)
const statusColors: Record<InventoryItemStatus, string> = {
  "EnUso": "bg-green-500 text-green-50",
  "EnAlmacen": "bg-blue-500 text-blue-50",
  "EnReparacion": "bg-yellow-500 text-yellow-50",
  "DeBaja": "bg-red-500 text-red-50",
  "Perdido": "bg-gray-500 text-gray-50",
};


export default function InventoryPage() {
  const { user, role, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast(); // Declarar toast al principio del componente

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

  const [searchTerm, setSearchTerm] = useState(''); 
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


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
    setFilteredItems(itemsToFilter.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (CATEGORY_DISPLAY_MAP[item.category] || item.category).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (STATUS_DISPLAY_MAP[item.status] || item.status).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.ram ? RAM_DISPLAY_MAP[item.ram] : "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.storageType ? STORAGE_DISPLAY_MAP[item.storageType] : "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [allItems, searchTerm]); 

  const handleItemAddedOrUpdated = () => {
    fetchItems(); 
    setIsAddDialogVisible(false);
    setIsEditDialogVisible(false);
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
    if (!selectedItemForDelete || !user?.email) {
      toast({ title: "Error", description: "No se puede eliminar el artículo o falta información del usuario.", variant: "destructive" });
      return;
    }
    setIsDeletingItem(true);
    const result = await deleteInventoryItemAction(selectedItemForDelete.id, user.email);
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

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      toast({ title: "Sin Archivo", description: "No se seleccionó ningún archivo.", variant: "destructive" });
      return;
    }
    if (!user || !user.email || !user.id || !user.name) { 
      toast({ title: "Error de Autenticación", description: "Debes iniciar sesión para importar.", variant: "destructive"});
      return;
    }

    const file = event.target.files[0];
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("No se pudo leer el archivo.");
        
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonDataFromExcel = XLSX.utils.sheet_to_json<ExcelInventoryItemData>(worksheet);
        
        const plainJsonData = jsonDataFromExcel.map(item => ({ ...item }));


        if (jsonDataFromExcel.length === 0) {
            toast({ title: "Archivo Vacío", description: "El archivo Excel no contiene datos.", variant: "destructive" });
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        
        const result = await importInventoryItemsAction(plainJsonData, user.email, user.id, user.name);

        if (result.success) {
          toast({
            title: "Importación Exitosa",
            description: `${result.successCount} artículos importados. ${result.errorCount > 0 ? `${result.errorCount} filas con errores.` : ''}`,
          });
          fetchItems();
        } else {
          let description = result.message || "Ocurrió un error durante la importación.";
          if (result.errorCount > 0 && result.successCount > 0) {
            description = `Importación parcial: ${result.successCount} artículos importados. ${result.errorCount} filas con errores.`;
          } else if (result.errorCount > 0) {
             description += ` Se encontraron ${result.errorCount} filas con errores.`;
          }
           if (result.errorCount > 0) {
             description += " Por favor, revisa la consola del navegador para más detalles sobre las filas con errores.";
           }
          toast({
            title: result.successCount > 0 ? "Importación Parcial con Errores" : "Fallo en la Importación",
            description: description,
            variant: "destructive",
            duration: 10000, 
          });
        }
        
        if (result.errors && result.errors.length > 0) {
           console.warn("Detalles de errores de importación (filas que no pudieron procesarse):", result.errors);
        }

      } catch (error) {
        console.error("Error al procesar el archivo Excel:", error);
        toast({ title: "Error de Importación", description: `No se pudo procesar el archivo. Asegúrate de que el formato es correcto. Error: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
      }
    };
    reader.readAsArrayBuffer(file);
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
    <div className="space-y-8 w-full"> 
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
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {user && (
              <Button onClick={() => setIsAddDialogVisible(true)} size="lg" className="shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" />
              Añadir Nuevo Artículo
              </Button>
          )}
           <Button 
            onClick={() => fileInputRef.current?.click()} 
            size="lg" 
            variant="outline"
            className="shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto"
            disabled={isImporting}
          >
            {isImporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
            {isImporting ? "Importando..." : "Importar Excel"}
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileImport} 
            accept=".xlsx, .xls" 
            className="hidden" 
            disabled={isImporting}
          />
        </div>
      </div>
      <Alert variant="default" className="bg-primary/5 border-primary/20">
        <Info className="h-5 w-5 text-primary" />
        <RadixAlertTitle className="font-semibold text-primary">Importación de Excel</RadixAlertTitle>
        <AlertDescription className="text-sm text-primary/80">
          Para importar desde Excel, asegúrate de que tu archivo tenga encabezados como: Nombre, Categoría, Marca, Modelo, Número de Serie, Procesador, RAM, Tipo de Almacenamiento, Capacidad de Almacenamiento, Cantidad, Ubicación, Estado, Notas Adicionales.
          La primera hoja del libro será procesada. <a href="/plantilla_inventario_ieq.xlsx" download className="underline font-medium hover:text-primary/90">Descargar plantilla de ejemplo</a> (Debes crear este archivo en tu carpeta `public`).
        </AlertDescription>
      </Alert>

      {/* Si usas InventoryFilters, asegúrate de que esté configurado para usar los nuevos tipos */}
      {/* <InventoryFilters allItems={allItems} onFilterChange={handleFilterChange} /> */}

      <Card className="shadow-lg w-full"> 
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
                    {/* CORRECCIÓN: Usar el mapa de visualización para la categoría */}
                    <TableCell>{CATEGORY_DISPLAY_MAP[item.category] || item.category}</TableCell>
                    <TableCell>{item.brand || <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell>{item.model || <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell>{item.serialNumber || <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell>
                      {/* CORRECCIÓN: Usar el mapa de visualización para el estado */}
                      <Badge variant="secondary" className={`${statusColors[item.status]} border-none`}>
                        {STATUS_DISPLAY_MAP[item.status] || item.status}
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

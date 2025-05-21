
"use client";

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { INVENTORY_ITEM_CATEGORIES } from '@/lib/types';
import type { InventoryItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { X } from 'lucide-react';

interface InventoryFiltersProps {
  allItems: InventoryItem[];
  onFilterChange: (filters: { category: string; location: string }) => void;
}

const ALL_FILTER_VALUE = "all"; // Constante para "todos"

export function InventoryFilters({ allItems, onFilterChange }: InventoryFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_FILTER_VALUE);
  const [selectedLocation, setSelectedLocation] = useState<string>(ALL_FILTER_VALUE);
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);

  useEffect(() => {
    const locations = new Set(allItems.map(item => item.location).filter(Boolean) as string[]);
    const sortedLocations = Array.from(locations).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    setUniqueLocations([ALL_FILTER_VALUE, ...sortedLocations]);
  }, [allItems]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onFilterChange({ category: value, location: selectedLocation });
  };

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    onFilterChange({ category: selectedCategory, location: value });
  };

  const clearFilters = () => {
    setSelectedCategory(ALL_FILTER_VALUE);
    setSelectedLocation(ALL_FILTER_VALUE);
    onFilterChange({ category: ALL_FILTER_VALUE, location: ALL_FILTER_VALUE });
  };

  // Cuando se proporcionen los departamentos, se reemplazarán los uniqueLocations aquí.
  // Por ahora, usamos las ubicaciones existentes.
  const departmentOptions = uniqueLocations; 

  return (
    <Card className="mb-6 shadow-md border-border/50">
        <CardHeader className="pb-4">
            <CardTitle className="text-xl">Filtrar Inventario</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3 items-end">
            <div>
                <Label htmlFor="category-filter" className="text-sm font-medium">Categoría</Label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger id="category-filter" className="mt-1">
                        <SelectValue placeholder="Todas las Categorías" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_FILTER_VALUE}>Todas las Categorías</SelectItem>
                        {INVENTORY_ITEM_CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="location-filter" className="text-sm font-medium">Departamento (Ubicación)</Label>
                <Select value={selectedLocation} onValueChange={handleLocationChange} disabled={departmentOptions.length <= 1}>
                    <SelectTrigger id="location-filter" className="mt-1">
                        <SelectValue placeholder="Todos los Departamentos" />
                    </SelectTrigger>
                    <SelectContent>
                        {departmentOptions.map(location => (
                            <SelectItem key={location} value={location}>
                                {location === ALL_FILTER_VALUE ? 'Todos los Departamentos' : location}
                            </SelectItem>
                        ))}
                        {departmentOptions.length <=1 && <SelectItem value="no-options" disabled>No hay ubicaciones definidas</SelectItem>}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end pt-2 md:pt-0"> {/* Ajuste para alinear el botón con los inputs en desktop */}
                <Button onClick={clearFilters} variant="outline" size="default">
                    <X className="mr-2 h-4 w-4" />
                    Limpiar Filtros
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { listarFallas } from "@/lib/fallas/actions";
import FallaEstadoBadge from "./FallaEstadoBadge";
import FallaSeveridadBadge from "./FallaSeveridadBadge";
import { FallaFilter } from "@/lib/fallas/types";
import { Bug } from 'lucide-react';

export default function FallaList({ filtros }: { filtros: FallaFilter }) {
  const [fallas, setFallas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listarFallas(filtros).then(data => {
      setFallas(data);
      setLoading(false);
    });
  }, [JSON.stringify(filtros)]);

  if (loading) return <div className="py-8 text-center">Cargando fallas...</div>;
  if (!fallas.length) return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <Bug className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-xl font-semibold">No Hay Fallas Registradas</h3>
      <p className="mb-4 mt-2 text-sm text-muted-foreground">
        Actualmente no hay fallas reportadas en el sistema.
      </p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="p-2">Título</th>
            <th className="p-2">Equipo</th>
            <th className="p-2">Ubicación</th>
            <th className="p-2">Severidad</th>
            <th className="p-2">Estado</th>
            <th className="p-2">Asignado a</th>
            <th className="p-2">Fecha de Reporte</th>
            <th className="p-2">Última Actualización</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {fallas.map(falla => (
            <tr key={falla.id} className="border-b hover:bg-muted/30">
              <td className="p-2 font-medium">{falla.titulo}</td>
              <td className="p-2">{falla.equipoNombre} <span className="block text-xs text-muted-foreground">{falla.equipoModelo} {falla.equipoNumeroSerie}</span></td>
              <td className="p-2">{falla.ubicacion}</td>
              <td className="p-2"><FallaSeveridadBadge severidad={falla.severidad} /></td>
              <td className="p-2"><FallaEstadoBadge estado={falla.estado} /></td>
              <td className="p-2">{falla.asignadoA?.name || <span className="text-xs text-muted-foreground">Sin asignar</span>}</td>
              <td className="p-2">{new Date(falla.createdAt).toLocaleString()}</td>
              <td className="p-2">{new Date(falla.updatedAt).toLocaleString()}</td>
              <td className="p-2">
                <a href={`/fallas/${falla.id}`} className="btn btn-xs btn-outline">Ver Detalle</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
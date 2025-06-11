import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FallaFormValues } from "@/lib/fallas/types";
import { crearFalla } from "@/lib/fallas/actions";
import { SeveridadFalla, TipoFalla } from "@prisma/client";
import { useAuth } from "@/lib/auth-context";

const schema = z.object({
  titulo: z.string().min(5, "El título es obligatorio"),
  descripcion: z.string().min(10, "La descripción es obligatoria"),
  equipoId: z.string().optional(),
  equipoNombre: z.string().min(2, "Selecciona un equipo"),
  equipoUbicacion: z.string().min(2, "La ubicación es obligatoria"),
  equipoFabricante: z.string().optional(),
  equipoModelo: z.string().optional(),
  equipoNumeroSerie: z.string().optional(),
  ubicacion: z.string().min(2, "La ubicación es obligatoria"),
  severidad: z.nativeEnum(SeveridadFalla),
  tipoFalla: z.nativeEnum(TipoFalla),
  impacto: z.string().optional(),
  adjuntos: z.any().optional(),
});

type FormData = z.infer<typeof schema>;

interface FallaFormProps {
  onSuccess?: () => void;
  isSubmitting?: boolean;
  onSubmitWrapper?: (submitFn: () => Promise<void>) => void;
}

export default function FallaForm({ onSuccess, isSubmitting, onSubmitWrapper }: FallaFormProps) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [adjuntos, setAdjuntos] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      severidad: "MEDIA",
      tipoFalla: "OTRO",
    } as any,
  });

  async function onSubmit(data: FormData) {
    if (!user) {
      setError("Debes iniciar sesión para reportar una falla");
      return;
    }
    setError(null);
    try {
      const formData: FallaFormValues = {
        ...data,
        adjuntos,
      };
      await crearFalla(formData, user.id);
      reset();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError(e.message || "Error al crear la falla");
    }
  }

  // Si se provee un wrapper, usarlo para el submit (para controlar loading desde el modal)
  const submitHandler = onSubmitWrapper
    ? (e: any) => onSubmitWrapper(() => handleSubmit(onSubmit)(e))
    : handleSubmit(onSubmit);

  return (
    <form id="falla-form" onSubmit={submitHandler} className="space-y-4 py-2">
      <div>
        <label className="block font-medium">Título de la Falla *</label>
        <input type="text" {...register("titulo")}
          className="input input-bordered w-full"
          placeholder="Ej: Falla en Bomba de Infusión" />
        {errors.titulo && <span className="text-red-500 text-sm">{errors.titulo.message}</span>}
      </div>
      <div>
        <label className="block font-medium">Descripción del Problema *</label>
        <textarea {...register("descripcion")} className="textarea textarea-bordered w-full min-h-[100px]" rows={3} placeholder="Detalla el problema presentado, síntomas, etc." />
        {errors.descripcion && <span className="text-red-500 text-sm">{errors.descripcion.message}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Equipo Afectado *</label>
          <input
            type="text"
            {...register("equipoNombre")}
            className="input input-bordered w-full"
            placeholder="Ej: Monitor Mindray VS800"
          />
          {errors.equipoNombre && <span className="text-red-500 text-sm">{errors.equipoNombre.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Ubicación *</label>
          <input type="text" {...register("ubicacion")}
            className="input input-bordered w-full"
            placeholder="Ej: Quirófano 2, UCI, Laboratorio" />
          {errors.ubicacion && <span className="text-red-500 text-sm">{errors.ubicacion.message}</span>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Severidad *</label>
          <select {...register("severidad")}
            className="select select-bordered w-full">
            {Object.values(SeveridadFalla).map((sev) => (
              <option key={sev} value={sev}>{sev}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Tipo de Falla *</label>
          <select {...register("tipoFalla")}
            className="select select-bordered w-full">
            {Object.values(TipoFalla).map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block font-medium">Impacto en el Paciente/Servicio (opcional)</label>
        <input type="text" {...register("impacto")}
          className="input input-bordered w-full"
          placeholder="Ej: Interrupción de monitoreo, retraso en atención, etc." />
      </div>
      <div>
        <label className="block font-medium">Adjuntos (fotos, videos, docs)</label>
        <input type="file" multiple onChange={e => setAdjuntos(Array.from(e.target.files || []))} />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </form>
  );
} 
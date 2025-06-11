import { EstadoFalla } from "@prisma/client";

const estadoColor: Record<EstadoFalla, string> = {
  REPORTADA: "bg-blue-500 text-white",
  EN_DIAGNOSTICO: "bg-yellow-500 text-black",
  PENDIENTE_PIEZA: "bg-orange-500 text-white",
  EN_REPARACION_INTERNA: "bg-purple-500 text-white",
  ESCALADA_EXTERNO: "bg-pink-600 text-white",
  EN_CALIBRACION: "bg-cyan-500 text-white",
  RESUELTA: "bg-green-600 text-white",
  CERRADA: "bg-gray-500 text-white",
  DUPLICADA: "bg-gray-400 text-black",
  NO_SE_REPRODUCE: "bg-gray-300 text-black",
};

export default function FallaEstadoBadge({ estado }: { estado: EstadoFalla }) {
  return <span className={`px-2 py-1 rounded text-xs font-bold ${estadoColor[estado]}`}>{estado.replace(/_/g, ' ')}</span>;
} 
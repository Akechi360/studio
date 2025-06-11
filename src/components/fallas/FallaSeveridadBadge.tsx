import { SeveridadFalla } from "@prisma/client";

export default function FallaSeveridadBadge({ severidad }: { severidad: SeveridadFalla }) {
  const color = {
    CRITICA: "bg-red-600 text-white",
    ALTA: "bg-orange-500 text-white",
    MEDIA: "bg-yellow-400 text-black",
    BAJA: "bg-green-500 text-white",
  }[severidad] || "bg-gray-300 text-black";
  return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{severidad}</span>;
} 
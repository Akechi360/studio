export interface TicketStats {
  summary: {
    total: number;
    abierto: number;
    enProgreso: number;
    resuelto: number;
    cerrado: number;
  };
  stats: {
    byStatus: Array<{ name: string; value: number }>;
    byPriority: Array<{ name: string; value: number }>;
    byCategory: Array<{ name: string; value: number }>;
  };
  resolutionTime: {
    average: number;
    distribution: Array<{ range: string; count: number }>;
  };
  categoryDistribution: Array<{ category: string; percentage: number }>;
} 
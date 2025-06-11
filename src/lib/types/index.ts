export * from './ticket-stats';

export interface TicketSummary {
  total: number;
  abierto: number;
  enProgreso: number;
  resuelto: number;
  cerrado: number;
}

export interface TicketStats {
  summary: TicketSummary;
  stats: {
    byStatus: Array<{ status: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
    byCategory: Array<{ category: string; count: number }>;
  };
  resolutionTime: {
    average: number;
    distribution: Array<{ range: string; count: number }>;
  };
  categoryDistribution: Array<{ category: string; percentage: number }>;
} 
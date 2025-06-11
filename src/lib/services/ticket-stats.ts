import { getDashboardStats } from "../actions";
import type { TicketStats } from "../types/ticket-stats";

export async function getTicketStats(): Promise<TicketStats> {
  try {
    const data = await getDashboardStats();
    
    // Transformar los datos al formato esperado
    const stats: TicketStats = {
      summary: {
        total: data.summary.total,
        abierto: data.summary.open,
        enProgreso: data.summary.inProgress,
        resuelto: data.summary.resolved,
        cerrado: data.summary.closed
      },
      stats: {
        byStatus: data.stats.byStatus.map(item => ({
          name: item.name === 'Open' ? 'Abierto' :
                item.name === 'In Progress' ? 'En Progreso' :
                item.name === 'InProgress' ? 'En Progreso' :
                item.name === 'Resolved' ? 'Resuelto' :
                item.name === 'Closed' ? 'Cerrado' : item.name,
          value: item.value
        })),
        byPriority: data.stats.byPriority.map(item => ({
          name: item.name === 'High' ? 'Alta' :
                item.name === 'Medium' ? 'Media' :
                item.name === 'Low' ? 'Baja' : item.name,
          value: item.value
        })),
        byCategory: [] // Por ahora está vacío ya que no lo proporciona getDashboardStats
      },
      resolutionTime: {
        average: 0, // Por ahora es 0 ya que no lo proporciona getDashboardStats
        distribution: [] // Por ahora está vacío ya que no lo proporciona getDashboardStats
      },
      categoryDistribution: [] // Por ahora está vacío ya que no lo proporciona getDashboardStats
    };

    return stats;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
} 
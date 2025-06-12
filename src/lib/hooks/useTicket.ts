import { useState, useEffect } from 'react';
import { Ticket } from '../types/tickets';

export function useTicket(id: string) {
  const [data, setData] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(`/api/tickets/${id}`);
        if (!response.ok) throw new Error('Error al cargar el ticket');
        const ticket = await response.json();
        setData(ticket);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  return { data, isLoading, error };
} 
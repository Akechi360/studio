
import { getTicketById } from '@/lib/actions';
import { TicketDetailView } from '@/components/tickets/ticket-detail-view';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TicketDetailPageProps {
  params: { id: string };
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const ticket = await getTicketById(params.id);

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="max-w-md text-center shadow-lg">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
          <AlertTitle className="text-xl font-bold">Ticket Not Found</AlertTitle>
          <AlertDescription className="mb-4">
            The ticket you are looking for does not exist or may have been removed.
          </AlertDescription>
          <Button asChild variant="outline">
            <Link href="/tickets">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Tickets
            </Link>
          </Button>
        </Alert>
      </div>
    );
  }

  return <TicketDetailView ticket={ticket} />;
}

export async function generateMetadata({ params }: TicketDetailPageProps) {
  const ticket = await getTicketById(params.id);
  if (!ticket) {
    return { title: "Ticket Not Found" };
  }
  return {
    title: `Ticket #${ticket.id}: ${ticket.subject}`,
    description: ticket.description.substring(0, 150) + "...",
  };
}


"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAISolutionSuggestion } from '@/lib/actions';
import { Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AISuggestionProps {
  ticketDescription: string;
}

export function AISuggestion({ ticketDescription }: AISuggestionProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    const result = await getAISolutionSuggestion(ticketDescription);
    if (result.suggestion) {
      setSuggestion(result.suggestion);
    } else {
      setError(result.error || "No se pudo obtener la sugerencia.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSuggestion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketDescription]); 

  return (
    <Card className="bg-accent/20 border-accent shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-accent">
          <Lightbulb className="mr-2 h-6 w-6" />
          Solución Sugerida por IA
        </CardTitle>
        <CardDescription>
          Impulsada por IA generativa, esta sugerencia podría ayudar a resolver el problema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="ml-2 text-muted-foreground">Generando sugerencia...</p>
          </div>
        )}
        {error && !isLoading && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {suggestion && !isLoading && (
          <div className="prose prose-sm dark:prose-invert max-w-none bg-background p-4 rounded-md shadow">
            <p>{suggestion}</p>
          </div>
        )}
         <div className="mt-4 flex justify-end">
          <Button onClick={fetchSuggestion} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Refrescando..." : "Refrescar Sugerencia"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Renamed to avoid conflict if AlertTriangle is imported from lucide-react elsewhere
const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

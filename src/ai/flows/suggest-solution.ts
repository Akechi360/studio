// 'use server'
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting solutions to support tickets
 * based on the ticket description.
 *
 * - suggestSolution - A function that takes a ticket description as input and returns a suggested solution.
 * - SuggestSolutionInput - The input type for the suggestSolution function.
 * - SuggestSolutionOutput - The output type for the suggestSolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the suggestSolution flow
const SuggestSolutionInputSchema = z.object({
  ticketDescription: z
    .string() 
    .describe('The description of the support ticket.'),
});

export type SuggestSolutionInput = z.infer<typeof SuggestSolutionInputSchema>;

// Define the output schema for the suggestSolution flow
const SuggestSolutionOutputSchema = z.object({
  suggestedSolution: z.string().describe('The suggested solution for the ticket.'),
});

export type SuggestSolutionOutput = z.infer<typeof SuggestSolutionOutputSchema>;

// Define the suggestSolution function
export async function suggestSolution(
  input: SuggestSolutionInput
): Promise<SuggestSolutionOutput> {
  return suggestSolutionFlow(input);
}

// Define the prompt for suggesting solutions
const suggestSolutionPrompt = ai.definePrompt({
  name: 'suggestSolutionPrompt',
  input: {schema: SuggestSolutionInputSchema},
  output: {schema: SuggestSolutionOutputSchema},
  prompt: `You are an AI assistant helping support administrators resolve tickets efficiently. Based on the following ticket description, suggest a solution.

Ticket Description: {{{ticketDescription}}}

Suggested Solution:`, // Just output the suggested solution, nothing else.
});

// Define the Genkit flow for suggesting solutions
const suggestSolutionFlow = ai.defineFlow(
  {
    name: 'suggestSolutionFlow',
    inputSchema: SuggestSolutionInputSchema,
    outputSchema: SuggestSolutionOutputSchema,
  },
  async input => {
    const {output} = await suggestSolutionPrompt(input);
    return output!;
  }
);

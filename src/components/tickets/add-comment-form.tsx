
"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/lib/auth-context';
import { useToast } from "@/hooks/use-toast";
import { addCommentAction } from '@/lib/actions';
import { Loader2, Send } from 'lucide-react';

const commentFormSchema = z.object({
  text: z.string().min(1, { message: "Comment cannot be empty." }).max(1000, { message: "Comment cannot exceed 1000 characters."}),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

interface AddCommentFormProps {
  ticketId: string;
  onCommentAdded?: () => void; // Optional callback after successful comment
}

export function AddCommentForm({ ticketId, onCommentAdded }: AddCommentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      text: "",
    },
  });

  async function onSubmit(data: CommentFormValues) {
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "You need to be logged in to add a comment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addCommentAction(ticketId, user, data);
      if (result.success) {
        toast({
          title: "Comment Added",
          description: "Your comment has been posted.",
        });
        form.reset();
        if (onCommentAdded) onCommentAdded();
      } else {
        toast({
          title: "Failed to Add Comment",
          description: result.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while adding the comment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Add a comment</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Type your comment here..."
                  className="min-h-[100px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Add Comment
        </Button>
      </form>
    </Form>
  );
}

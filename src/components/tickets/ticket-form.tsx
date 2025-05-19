
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TICKET_PRIORITIES } from "@/lib/constants";
import type { TicketPriority } from "@/lib/types";
import { Loader2, Send } from "lucide-react";

const ticketFormSchema = z.object({
  subject: z.string().min(5, { message: "Subject must be at least 5 characters long." }).max(100, { message: "Subject must be at most 100 characters long." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters long." }).max(2000, { message: "Description must be at most 2000 characters long." }),
  priority: z.enum(TICKET_PRIORITIES as [TicketPriority, ...TicketPriority[]], {
    required_error: "You need to select a ticket priority.",
  }),
  // attachments: z.array(z.instanceof(File)).optional(), // For actual file uploads
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  onSubmit: (data: TicketFormValues) => Promise<void>;
  defaultValues?: Partial<TicketFormValues>;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

export function TicketForm({ 
  onSubmit, 
  defaultValues,
  isSubmitting = false,
  submitButtonText = "Submit Ticket"
}: TicketFormProps) {
  
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      subject: defaultValues?.subject || "",
      description: defaultValues?.description || "",
      priority: defaultValues?.priority || "Medium",
      // attachments: defaultValues?.attachments || [],
    },
  });

  // const [selectedFiles, setSelectedFiles] = useState<File[]>(defaultValues?.attachments || []);

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   if (event.target.files) {
  //     const filesArray = Array.from(event.target.files);
  //     setSelectedFiles(prevFiles => [...prevFiles, ...filesArray]);
  //     // Optionally, update form value if using react-hook-form for files
  //     // form.setValue("attachments", [...selectedFiles, ...filesArray]);
  //   }
  // };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Create a New Support Ticket</CardTitle>
        <CardDescription>Please fill out the form below to submit your support request. Provide as much detail as possible.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Unable to login" {...field} />
                  </FormControl>
                  <FormDescription>
                    A brief summary of your issue.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your issue in detail..."
                      className="min-h-[150px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include steps to reproduce, error messages, and any other relevant information.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TICKET_PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How urgent is this issue?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Basic attachment UI placeholder */}
            {/* <FormItem>
              <FormLabel>Attachments (Optional)</FormLabel>
              <FormControl>
                <Input type="file" multiple onChange={handleFileChange} />
              </FormControl>
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>Selected files:</p>
                  <ul>
                    {selectedFiles.map((file, index) => (
                      <li key={index}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
                    ))}
                  </ul>
                </div>
              )}
              <FormDescription>
                You can attach screenshots or relevant files (max 5MB per file).
              </FormDescription>
            </FormItem> */}

            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {submitButtonText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

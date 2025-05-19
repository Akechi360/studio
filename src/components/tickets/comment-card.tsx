
"use client";

import type { Comment } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';

interface CommentCardProps {
  comment: Comment;
}

export function CommentCard({ comment }: CommentCardProps) {
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex space-x-4 py-4 border-b border-border last:border-b-0">
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.userAvatarUrl || `https://placehold.co/40x40.png?text=${getInitials(comment.userName)}`} alt={comment.userName} data-ai-hint="profile avatar" />
        <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{comment.userName}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </p>
        </div>
        <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">
          {comment.text}
        </p>
      </div>
    </div>
  );
}

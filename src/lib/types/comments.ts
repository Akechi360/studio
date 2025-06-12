export interface CreateCommentData {
  text: string;
  ticketId: string;
  userId: string;
  userName: string;
}

export interface Comment {
  id: string;
  displayId?: string;
  text: string;
  ticketId: string;
  userId: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
} 
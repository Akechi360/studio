export interface CreateAttachmentData {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  ticketId: string;
  userId: string;
  userName: string;
}

export interface Attachment {
  id: string;
  displayId?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  ticketId: string;
  userId: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
} 

import type { Ticket, Comment, TicketPriority, TicketStatus, User } from '@/lib/types';

const users: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Admin', avatarUrl: 'https://placehold.co/40x40.png?text=AU' },
  { id: '2', name: 'Regular User', email: 'user@example.com', role: 'User', avatarUrl: 'https://placehold.co/40x40.png?text=RU' },
  { id: '3', name: 'Alice Wonderland', email: 'alice@example.com', role: 'User', avatarUrl: 'https://placehold.co/40x40.png?text=AW' },
  { id: '4', name: 'Bob The Builder', email: 'bob@example.com', role: 'User', avatarUrl: 'https://placehold.co/40x40.png?text=BB' },
];

const getRandomUser = (): User => users[Math.floor(Math.random() * users.length)];
const getRandomPriority = (): TicketPriority => {
  const priorities: TicketPriority[] = ['Low', 'Medium', 'High'];
  return priorities[Math.floor(Math.random() * priorities.length)];
};
const getRandomStatus = (): TicketStatus => {
  const statuses: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const createMockComment = (id: string, ticketId: string): Comment => {
  const user = getRandomUser();
  return {
    id: `comment-${ticketId}-${id}`,
    text: `This is comment number ${id} for ticket ${ticketId}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    userId: user.id,
    userName: user.name,
    userAvatarUrl: user.avatarUrl,
    createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 5), // Random date in last 5 days
  };
};

export const mockTickets: Ticket[] = Array.from({ length: 15 }, (_, i) => {
  const ticketId = (i + 1).toString();
  const user = getRandomUser();
  const numComments = Math.floor(Math.random() * 5);
  const comments = Array.from({ length: numComments }, (_, j) => createMockComment((j + 1).toString(), ticketId));
  comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return {
    id: ticketId,
    subject: `Issue with Feature #${ticketId} - ${['Login Page', 'Payment Gateway', 'User Profile', 'Dashboard Display', 'API Integration'][i % 5]}`,
    description: `Detailed description for ticket ${ticketId}: Experiencing a problem with the ${['Login Page', 'Payment Gateway', 'User Profile', 'Dashboard Display', 'API Integration'][i % 5]}. It shows an error message when I try to ${['submit the form', 'process a transaction', 'update my details', 'load the chart', 'fetch data'][(i+1) % 5]}. This started happening after the last update. Please investigate. I have attached a screenshot of the error. My operating system is ${['Windows 10', 'MacOS Sonoma', 'Ubuntu 22.04'][i % 3]} and browser is ${['Chrome', 'Firefox', 'Safari'][i % 3]}.`,
    priority: getRandomPriority(),
    status: getRandomStatus(),
    attachments: i % 3 === 0 ? [
      { id: `att-${ticketId}-1`, fileName: `screenshot-${ticketId}.png`, url: `https://placehold.co/300x200.png?text=Attachment+${ticketId}`, size: Math.floor(Math.random() * 1024 * 500) + 102400 },
    ] : [],
    userId: user.id,
    userName: user.name,
    createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 10), // Random date in last 10 days
    updatedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 2), // Random date in last 2 days
    comments: comments,
  };
}).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());

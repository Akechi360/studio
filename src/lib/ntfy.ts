
// src/lib/ntfy.ts

// In a real app, these should come from environment variables (e.g., process.env.NTFY_SERVER_URL)
const NTFY_SERVER_URL = 'https://ntfy.sh';
export const NTFY_DEFAULT_TOPIC = 'ieq-nexo-notificaciones'; // Export for potential display in settings

interface NtfyPayload {
  topic: string;
  message: string;
  title?: string;
  priority?: 1 | 2 | 3 | 4 | 5; // 1=min, 3=default, 5=max
  tags?: string[];
  click?: string; // URL to open on click
  icon?: string; // URL to an icon (e.g., direct link to a .png or .ico)
  // Add other NTFY features if needed: actions, email, delay, etc.
}

export async function sendNtfyNotification(
  payload: Omit<NtfyPayload, 'topic'> & { topic?: string }
): Promise<void> {
  const {
    topic = NTFY_DEFAULT_TOPIC,
    message,
    title,
    priority,
    tags,
    click,
    icon,
  } = payload;

  if (!topic) {
    console.warn('NTFY: Topic is not defined. Skipping notification.');
    return;
  }
  if (!message) {
    console.warn('NTFY: Message is not defined. Skipping notification.');
    return;
  }

  const headers: HeadersInit = {
    'Content-Type': 'text/plain; charset=utf-8', // ntfy.sh expects plain text for message in body
  };
  if (title) headers['Title'] = title;
  if (priority) headers['Priority'] = priority.toString();
  if (tags && tags.length > 0) headers['Tags'] = tags.join(',');
  if (click) headers['Click'] = click;
  if (icon) headers['Icon'] = icon;
  // If using access tokens for private topics:
  // if (NTFY_ACCESS_TOKEN) headers['Authorization'] = `Bearer ${NTFY_ACCESS_TOKEN}`;

  try {
    const response = await fetch(`${NTFY_SERVER_URL}/${topic}`, {
      method: 'POST',
      body: message,
      headers: headers,
    });

    if (!response.ok) {
      console.error(
        `NTFY: Failed to send notification to topic ${topic}. Status: ${response.status}`,
        await response.text()
      );
    } else {
      console.log(`NTFY: Notification sent successfully to topic ${topic}.`);
    }
  } catch (error) {
    console.error(`NTFY: Error sending notification to topic ${topic}:`, error);
  }
}

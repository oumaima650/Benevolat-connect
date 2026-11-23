const API_BASE = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:8080';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatApiResponse {
  reply: string;
  fallback: boolean;
  suggestions: string[];
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  token?: string | null,
): Promise<ChatApiResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api/chatbot/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, history }),
  });

  if (res.status === 429) throw new Error('429');
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<ChatApiResponse>;
}

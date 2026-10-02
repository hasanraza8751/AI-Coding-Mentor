/**
 * In-memory, session-level conversation history (Milestone 3).
 *
 * - Bounded: only the most recent N messages are kept, so prompts
 *   cannot grow without limit.
 * - Per-session: histories are keyed by session id, so unrelated
 *   clients that send different `conversationId` values never share
 *   context. Clients that send none share the "default" session,
 *   which matches the previous single-user behavior.
 * - Volatile: no database, no SQLite, no persistence. Restarting the
 *   server clears all history.
 */
export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const DEFAULT_SESSION_ID = 'default';

export class ConversationStore {
  private readonly sessions = new Map<string, StoredMessage[]>();

  constructor(private readonly maxMessages: number = 20) {}

  private key(sessionId?: string): string {
    const trimmed = (sessionId ?? '').trim();
    return trimmed.length > 0 ? trimmed : DEFAULT_SESSION_ID;
  }

  /** Recent messages for one session, oldest first. */
  public getHistory(sessionId?: string): StoredMessage[] {
    return [...(this.sessions.get(this.key(sessionId)) ?? [])];
  }

  /**
   * Record a completed user → assistant exchange. Only call this after
   * a successful model response so failed attempts do not pollute
   * future context.
   */
  public appendTurn(
    sessionId: string | undefined,
    userMessage: string,
    assistantMessage: string
  ): void {
    const key = this.key(sessionId);
    const history = this.sessions.get(key) ?? [];
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantMessage }
    );
    while (history.length > this.maxMessages) {
      history.splice(0, history.length - this.maxMessages);
    }
    this.sessions.set(key, history);
  }

  public clear(sessionId?: string): void {
    this.sessions.delete(this.key(sessionId));
  }
}

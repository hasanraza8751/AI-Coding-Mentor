/**
 * HTTP client for the local AI Coding Mentor backend.
 *
 * The extension host runs on Node.js, so the global `fetch` API is used —
 * no extra dependencies. The WebView never calls the backend directly;
 * all traffic goes WebView → extension host → HTTP → backend.
 *
 * Timeouts use AbortController so a hung server cannot freeze the UI.
 * All failures surface as BackendError with a human-readable message
 * the provider forwards to the WebView as an error bubble.
 */
import type { EnglishCorrection, MentorResponse } from '../types';

export class BackendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendError';
  }
}

interface ChatSuccessBody {
  answer?: unknown;
  english?: unknown;
}

interface ApiErrorBody {
  error?: unknown;
}

export class BackendClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number = 120000
  ) {}

  private chatUrl(): string {
    return `${this.baseUrl.replace(/\/+$/, '')}/api/chat`;
  }

  public async sendMessage(message: string): Promise<MentorResponse> {
    const url = this.chatUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
          signal: controller.signal
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new BackendError(
            `Backend timed out after ${this.timeoutMs} ms. Is the server overloaded?`
          );
        }
        throw new BackendError(
          `Backend unavailable at ${url}. Start it with "npm run dev" in server/ and try again.`
        );
      }

      let data: ChatSuccessBody & ApiErrorBody;
      try {
        data = (await res.json()) as ChatSuccessBody & ApiErrorBody;
      } catch {
        throw new BackendError(
          `Invalid JSON response from backend (HTTP ${res.status}).`
        );
      }

      if (!res.ok) {
        const serverMsg =
          typeof data?.error === 'string' && data.error.trim().length > 0
            ? data.error
            : `Backend request failed (HTTP ${res.status}).`;
        throw new BackendError(serverMsg);
      }

      if (typeof data?.answer !== 'string') {
        throw new BackendError(
          'Malformed backend response: missing string "answer".'
        );
      }

      return { answer: data.answer, english: normalizeCorrection(data.english) };
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Normalize the English correction block. The backend guarantees the
 * shape, but a strict check here keeps a backend regression from
 * breaking the WebView — fall back to "no correction" instead.
 */
function normalizeCorrection(value: unknown): EnglishCorrection {
  const fallback: EnglishCorrection = {
    needsCorrection: false,
    original: '',
    corrected: '',
    explanation: ''
  };
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fallback;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.needsCorrection !== 'boolean') {
    return fallback;
  }
  const text = (field: unknown): string =>
    typeof field === 'string' ? field : '';
  if (!record.needsCorrection) {
    return fallback;
  }
  return {
    needsCorrection: true,
    original: text(record.original),
    corrected: text(record.corrected),
    explanation: text(record.explanation)
  };
}

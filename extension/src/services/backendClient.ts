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
export class BackendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendError';
  }
}

interface ChatSuccessBody {
  answer?: unknown;
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

  public async sendMessage(message: string): Promise<string> {
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

      return data.answer;
    } finally {
      clearTimeout(timer);
    }
  }
}

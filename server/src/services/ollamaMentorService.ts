import { MENTOR_SYSTEM_PROMPT } from '../prompts/mentorSystemPrompt';
import type { MentorResponse } from '../types';
import { ConversationStore } from './conversationStore';
import { MentorService, MentorServiceError } from './mentorService';
import { parseMentorResponse } from './mentorResponseParser';

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatResponse {
  message?: { role?: unknown; content?: unknown };
  error?: unknown;
}

/**
 * Ollama-backed mentor (Milestone 4: structured mentor + English coach).
 * Talks to the local Ollama HTTP API with the configured model
 * (default qwen3:8b) using direct fetch — no SDK needed for the simple
 * non-streaming /api/chat call. `format: "json"` asks Ollama for
 * JSON-only output, but the result is still validated, never trusted.
 *
 * Conversation context comes from the per-session ConversationStore:
 * recent answers are prepended to every request so follow-ups like
 * "How do I store it?" resolve against earlier messages.
 */
export class OllamaMentorService implements MentorService {
  private readonly store: ConversationStore;

  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly timeoutMs: number,
    maxHistoryMessages: number
  ) {
    this.store = new ConversationStore(maxHistoryMessages);
  }

  public async getResponse(
    message: string,
    sessionId?: string
  ): Promise<MentorResponse> {
    const userText = message.trim();
    const history = this.store.getHistory(sessionId);
    const startedAt = Date.now();

    // eslint-disable-next-line no-console
    console.log(
      `[mentor] Ollama request started model="${this.model}" ` +
        `historyMessages=${history.length}`
    );

    const messages: OllamaChatMessage[] = [
      { role: 'system', content: MENTOR_SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: userText }
    ];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      let res: Response;
      try {
        res = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            messages,
            stream: false,
            format: 'json'
          }),
          signal: controller.signal
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new MentorServiceError(
            `Ollama request timed out after ${this.timeoutMs} ms. ` +
              `The model may still be loading — try a shorter question or retry.`,
            504
          );
        }
        throw new MentorServiceError(
          `Ollama is not reachable at ${this.baseUrl}. ` +
            `Start Ollama (run "ollama serve") and try again.`,
          503
        );
      }

      if (!res.ok) {
        throw await this.describeOllamaHttpError(res);
      }

      const rawContent = await this.extractContent(res);

      // Validate the structured output; fall back to a usable plain
      // answer instead of crashing or leaking parse errors.
      const parsed = parseMentorResponse(rawContent, userText);
      if (parsed.usedFallback) {
        // eslint-disable-next-line no-console
        console.warn(
          `[mentor] structured parse fallback (${parsed.reason}); ` +
            'returning salvaged answer.'
        );
      }

      // Only successful exchanges become future context. The plain
      // answer (not the JSON envelope) is stored to keep context clean.
      this.store.appendTurn(sessionId, userText, parsed.response.answer);

      // eslint-disable-next-line no-console
      console.log(
        `[mentor] Ollama request completed in ${Date.now() - startedAt} ms`
      );
      return parsed.response;
    } catch (error) {
      if (error instanceof MentorServiceError) {
        // eslint-disable-next-line no-console
        console.error(`[mentor] Ollama request failed: ${error.message}`);
        throw error;
      }
      // eslint-disable-next-line no-console
      console.error('[mentor] Ollama request failed unexpectedly:', error);
      throw new MentorServiceError(
        'Unexpected error while contacting Ollama. Check the server logs and try again.',
        500
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private async describeOllamaHttpError(
    res: Response
  ): Promise<MentorServiceError> {
    const status = res.status;
    let serverDetail = '';
    try {
      const text = await res.text();
      try {
        const parsed = JSON.parse(text) as { error?: unknown };
        serverDetail =
          typeof parsed?.error === 'string' ? parsed.error : text;
      } catch {
        serverDetail = text;
      }
    } catch {
      serverDetail = '';
    }
    const lowered = serverDetail.toLowerCase();
    if (
      status === 404 ||
      lowered.includes('not found') ||
      lowered.includes('no such model')
    ) {
      return new MentorServiceError(
        `Ollama could not serve model "${this.model}" (HTTP ${status}). ` +
          `Verify Ollama is running at ${this.baseUrl}, check "ollama list", ` +
          `or run "ollama pull ${this.model}".`,
        502
      );
    }
    const capped =
      serverDetail.length > 300
        ? serverDetail.slice(0, 300) + '…'
        : serverDetail;
    const suffix = capped.trim().length > 0 ? ` Details: ${capped}` : '';
    return new MentorServiceError(
      `Ollama request failed (HTTP ${status}). ` +
        `Verify Ollama is running and model "${this.model}" is installed ("ollama list").` +
        suffix,
      502
    );
  }

  /**
   * Extract the raw message content string from a 200 Ollama payload.
   * Structure validation happens later in the response parser.
   */
  private async extractContent(res: Response): Promise<string> {
    let data: OllamaChatResponse;
    try {
      data = (await res.json()) as OllamaChatResponse;
    } catch {
      throw new MentorServiceError(
        'Ollama returned a malformed (non-JSON) response. Try again.',
        502
      );
    }

    // A 200 with an embedded error payload (e.g. unknown model) must
    // surface as a helpful message instead of an empty answer.
    if (typeof data?.error === 'string' && data.error.trim().length > 0) {
      throw this.describeOllamaPayloadError(data.error);
    }

    const content = data?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new MentorServiceError(
        'Ollama returned an empty response. Try rephrasing your question.',
        502
      );
    }
    return content.trim();
  }

  private describeOllamaPayloadError(raw: string): MentorServiceError {
    const lowered = raw.toLowerCase();
    if (lowered.includes('not found') || lowered.includes('no such model')) {
      return new MentorServiceError(
        `Model "${this.model}" was not found by Ollama. ` +
          `Run "ollama pull ${this.model}" and try again.`,
        502
      );
    }
    const capped = raw.length > 300 ? raw.slice(0, 300) + '…' : raw;
    return new MentorServiceError(
      `Ollama reported an error: ${capped}`,
      502
    );
  }
}

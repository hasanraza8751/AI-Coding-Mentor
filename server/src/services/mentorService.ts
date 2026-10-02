/**
 * Mentor response abstraction (Milestone 4: structured response).
 *
 * The route layer depends only on this interface, so the mentor backend
 * can be swapped (mock ↔ Ollama ↔ future providers) without touching
 * the HTTP code:
 *
 *   VS Code Extension → Node.js Backend → MentorService → Ollama/Qwen3
 */
import { EMPTY_ENGLISH_CORRECTION, MentorResponse } from '../types';

export interface MentorService {
  getResponse(
    message: string,
    sessionId?: string
  ): Promise<MentorResponse> | MentorResponse;
}

/**
 * Service-level failure with an HTTP status the route can forward.
 * Messages must always be user-safe: no stack traces, no raw dumps.
 */
export class MentorServiceError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'MentorServiceError';
    this.statusCode = statusCode;
  }
}

/**
 * Mock implementation kept for UI testing without Ollama.
 * Select with MENTOR_PROVIDER=mock. Returns a valid structured
 * response with no correction. Deliberately has no LLM,
 * network, voice, RAG, tool, or DB logic.
 */
export class MockMentorService implements MentorService {
  public async getResponse(message: string): Promise<MentorResponse> {
    const trimmed = message.trim();
    const preview =
      trimmed.length > 120 ? trimmed.slice(0, 120) + '…' : trimmed;

    return {
      english: { ...EMPTY_ENGLISH_CORRECTION },
      answer:
        `Thanks for asking: "${preview}"\n\n` +
        `This is a mock mentor response from the local backend.\n` +
        `Set MENTOR_PROVIDER=ollama (default) to use Qwen3 via Ollama.`
    };
  }
}

/**
 * Shared HTTP contract types for the local backend (Milestone 3).
 *
 * No voice / RAG / tool / memory types here — history is in-memory
 * session context only, scoped by the optional `conversationId`.
 */

/** GET /health */
export interface HealthResponse {
  status: 'ok';
}

/** POST /api/chat — request body */
export interface ChatRequestBody {
  message?: unknown;
  /** Optional session key for in-memory history. Omit to use "default". */
  conversationId?: unknown;
}

/** POST /api/chat — success */
export interface ChatSuccessResponse {
  answer: string;
}

/** Error envelope used for 4xx/5xx responses. */
export interface ApiErrorResponse {
  error: string;
}

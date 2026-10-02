/**
 * Shared HTTP contract types for the local backend (Milestone 4).
 *
 * The chat endpoint now returns a structured mentor response: an
 * optional English correction plus the coding answer. History remains
 * in-memory session context only — no voice / RAG / tool / memory
 * types live here.
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

/**
 * English coaching result. When `needsCorrection` is false the other
 * fields are empty strings and the UI hides the correction card.
 */
export interface EnglishCorrection {
  needsCorrection: boolean;
  original: string;
  corrected: string;
  explanation: string;
}

/** POST /api/chat — success */
export interface MentorResponse {
  english: EnglishCorrection;
  answer: string;
}

export type ChatSuccessResponse = MentorResponse;

/** Error envelope used for 4xx/5xx responses. */
export interface ApiErrorResponse {
  error: string;
}

/** Canonical "no correction" value. Copy (don't mutate) when reusing. */
export const EMPTY_ENGLISH_CORRECTION: EnglishCorrection = {
  needsCorrection: false,
  original: '',
  corrected: '',
  explanation: ''
};

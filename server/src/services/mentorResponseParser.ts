/**
 * Validation + safe fallback for Qwen's structured mentor output
 * (Milestone 4).
 *
 * The model is instructed to return a single JSON object, but its
 * output is never trusted blindly: it may wrap the JSON in fences,
 * include reasoning traces, or drift off-schema. This module tries
 * to recover the intended response and otherwise falls back to a
 * usable plain-text answer so the server never crashes and the UI
 * never receives a raw parsing error.
 *
 * No `any` is used — the parsed payload is narrowed with type guards.
 */
import {
  EMPTY_ENGLISH_CORRECTION,
  EnglishCorrection,
  MentorResponse
} from '../types';

export interface ParsedMentorResponse {
  response: MentorResponse;
  /** True when the model output failed validation and was salvaged. */
  usedFallback: boolean;
  /** Short machine log tag (safe to log; contains no user content). */
  reason?: string;
}

// Defensive caps so a runaway correction can't dominate the UI.
const MAX_CORRECTION_FIELD = 300;
const MAX_EXPLANATION_FIELD = 500;

function cap(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) + '…' : trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * Remove Qwen `<think>` traces and Markdown code fences so only the
 * intended JSON (or answer text) remains.
 */
function cleanModelText(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

/** Extract the outermost `{...}` block when JSON is embedded in prose. */
function extractJsonBlock(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Validate a parsed payload against the mentor schema. Returns a
 * normalized MentorResponse, or null when the payload is unusable.
 * A `true` correction without an actual corrected sentence is
 * downgraded to "no correction" rather than showing an empty card.
 */
function validatePayload(
  payload: Record<string, unknown>
): MentorResponse | null {
  const englishRaw = payload.english;
  if (!isRecord(englishRaw)) {
    return null;
  }
  if (typeof englishRaw.needsCorrection !== 'boolean') {
    return null;
  }
  const answer = asString(payload.answer);
  if (answer === null || answer.trim().length === 0) {
    return null;
  }

  const original = asString(englishRaw.original) ?? '';
  const corrected = asString(englishRaw.corrected) ?? '';
  const explanation = asString(englishRaw.explanation) ?? '';

  let english: EnglishCorrection;
  if (!englishRaw.needsCorrection) {
    english = { ...EMPTY_ENGLISH_CORRECTION };
  } else if (corrected.trim().length === 0) {
    // Model claimed a correction but supplied none — hide the card.
    english = { ...EMPTY_ENGLISH_CORRECTION };
  } else {
    english = {
      needsCorrection: true,
      original: cap(original, MAX_CORRECTION_FIELD),
      corrected: cap(corrected, MAX_CORRECTION_FIELD),
      explanation: cap(explanation, MAX_EXPLANATION_FIELD)
    };
  }

  return { english, answer: answer.trim() };
}

/**
 * Build a fallback from unusable model output. Non-empty raw text is
 * reused as the answer (the user still gets help); otherwise a short
 * generic message is used. Never throws.
 */
function fallbackResponse(rawText: string, reason: string): ParsedMentorResponse {
  const cleaned = cleanModelText(rawText);
  const answer =
    cleaned.length > 0
      ? cleaned
      : 'I could not generate a structured response. Please try rephrasing your question.';
  return {
    response: {
      english: { ...EMPTY_ENGLISH_CORRECTION },
      answer
    },
    usedFallback: true,
    reason
  };
}

/**
 * Parse one round of model output into a validated MentorResponse.
 * `userMessage` is accepted for future per-message checks and to keep
 * call sites explicit; it is never logged here.
 */
export function parseMentorResponse(
  rawContent: string,
  _userMessage: string
): ParsedMentorResponse {
  const cleaned = cleanModelText(rawContent);
  if (cleaned.length === 0) {
    return fallbackResponse(rawContent, 'empty-model-output');
  }

  const direct = parseJsonObject(cleaned);
  if (direct !== null) {
    const valid = validatePayload(direct);
    if (valid !== null) {
      return { response: valid, usedFallback: false };
    }
    // Valid JSON but wrong schema — the raw text may still be a
    // useful plain answer, so fall through to salvage it below.
    return fallbackResponse(rawContent, 'schema-mismatch');
  }

  const block = extractJsonBlock(cleaned);
  if (block !== null) {
    const embedded = parseJsonObject(block);
    if (embedded !== null) {
      const valid = validatePayload(embedded);
      if (valid !== null) {
        return { response: valid, usedFallback: false };
      }
    }
    return fallbackResponse(rawContent, 'embedded-schema-mismatch');
  }

  return fallbackResponse(rawContent, 'not-json');
}

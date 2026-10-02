import 'dotenv/config';
import type { Express } from 'express';

/**
 * Read and validate the server port.
 * Defaults to 3000 so the extension default URL keeps working.
 */
export function getPort(): number {
  return parsePositiveInt(process.env.PORT, 3000, 1, 65535);
}

/** Which mentor implementation the server should use. */
export type MentorProvider = 'ollama' | 'mock';

/**
 * MENTOR_PROVIDER=mock keeps the old stub for UI testing without Ollama.
 * Anything else (including unset) selects the Ollama-backed mentor.
 */
export function getMentorProvider(): MentorProvider {
  const raw = (process.env.MENTOR_PROVIDER ?? 'ollama').trim().toLowerCase();
  return raw === 'mock' ? 'mock' : 'ollama';
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

/**
 * Ollama connection settings. Nothing is hardcoded: every value comes
 * from the environment with a documented default (see .env.example).
 */
export function getOllamaConfig(): OllamaConfig {
  const baseUrl = (
    process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
  ).replace(/\/+$/, '');
  const model = (process.env.OLLAMA_MODEL ?? 'qwen3:8b').trim();
  return {
    baseUrl: baseUrl.length > 0 ? baseUrl : 'http://localhost:11434',
    model: model.length > 0 ? model : 'qwen3:8b',
    timeoutMs: parsePositiveInt(process.env.OLLAMA_TIMEOUT_MS, 120000)
  };
}

/**
 * Maximum number of stored chat messages (user + assistant combined)
 * sent back to the model as short-term context. Bounded so prompts
 * cannot grow without limit. In-memory only — no persistence.
 */
export function getHistoryLimit(): number {
  return parsePositiveInt(process.env.CONVERSATION_HISTORY_LIMIT, 20);
}

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  min = 1,
  max = Number.MAX_SAFE_INTEGER
): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    if (raw !== undefined) {
      // eslint-disable-next-line no-console
      console.warn(`Invalid value "${raw}", falling back to ${fallback}.`);
    }
    return fallback;
  }
  return parsed;
}

/**
 * Base URL logged at startup so the extension setting can be compared.
 */
export function getBaseUrl(app: Express): string {
  const address = app.get('port') as number | undefined;
  return `http://localhost:${address ?? getPort()}`;
}

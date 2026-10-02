/**
 * Shared message / protocol types for the AI Coding Mentor extension.
 *
 * Milestone 4: the backend returns a structured mentor response
 * (English correction + coding answer). The WebView still talks only
 * to the extension host, which talks HTTP to the local backend.
 * No voice, tool, or storage types live here.
 */

/** Who sent a chat bubble. 'error' renders as a red-tinted bubble. */
export type ChatRole = 'user' | 'assistant' | 'error';

/** One row in the conversation. */
export interface ChatMessage {
  role: ChatRole;
  text: string;
}

/** English coaching result. Empty strings when no correction needed. */
export interface EnglishCorrection {
  needsCorrection: boolean;
  original: string;
  corrected: string;
  explanation: string;
}

/** Structured mentor reply: secondary correction + primary answer. */
export interface MentorResponse {
  english: EnglishCorrection;
  answer: string;
}

/** WebView -> extension host. */
export interface WebviewToExtensionMessage {
  type: 'sendMessage';
  text: string;
}

/** Extension host -> WebView. */
export type ExtensionToWebviewMessage =
  | { type: 'assistantResponse'; answer: string; english: EnglishCorrection }
  | { type: 'errorResponse'; text: string }
  | { type: 'clearConversation' };

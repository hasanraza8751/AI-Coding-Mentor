/**
 * Shared message / protocol types for the AI Coding Mentor extension.
 *
 * Milestone 2: the WebView still talks only to the extension host,
 * and the extension host talks HTTP to the local backend.
 * No LLM, voice, tool, or storage types live here yet.
 */

/** Who sent a chat bubble. 'error' renders as a red-tinted bubble. */
export type ChatRole = 'user' | 'assistant' | 'error';

/** One row in the conversation. */
export interface ChatMessage {
  role: ChatRole;
  text: string;
}

/** WebView -> extension host. */
export interface WebviewToExtensionMessage {
  type: 'sendMessage';
  text: string;
}

/** Extension host -> WebView. */
export type ExtensionToWebviewMessage =
  | { type: 'assistantResponse'; text: string }
  | { type: 'errorResponse'; text: string }
  | { type: 'clearConversation' };

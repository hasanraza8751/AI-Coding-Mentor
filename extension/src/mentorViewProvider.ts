import * as vscode from 'vscode';
import { getWebviewContent } from './panel/getWebviewContent';
import { BackendClient, BackendError } from './services/backendClient';
import type { WebviewToExtensionMessage } from './types';

const DEFAULT_BACKEND_URL = 'http://localhost:3000';
// Local Qwen3 inference (especially cold starts) can take a minute+,
// so the default tolerates the server-side OLLAMA_TIMEOUT_MS of 120s.
const DEFAULT_TIMEOUT_MS = 120000;

/**
 * Sidebar chat provider (Milestone 4: structured mentor response).
 *
 * Flow: WebView --(sendMessage)--> provider --HTTP--> backend /api/chat
 *        backend --({english, answer} | error)--> provider --postMessage--> WebView
 *
 * This file contains no AI logic — only transport + error mapping.
 */
export class MentorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'aiCodingMentor.chatView';

  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = getWebviewContent();

    webviewView.webview.onDidReceiveMessage(
      (message: WebviewToExtensionMessage) => {
        if (message?.type === 'sendMessage') {
          void this.handleUserMessage(message.text);
        }
      }
    );
  }

  private resolveBackendClient(): BackendClient {
    const config = vscode.workspace.getConfiguration('aiCodingMentor');
    const baseUrl = config.get<string>('backendUrl', DEFAULT_BACKEND_URL);
    const timeoutMs = config.get<number>(
      'requestTimeoutMs',
      DEFAULT_TIMEOUT_MS
    );
    return new BackendClient(
      baseUrl.trim().length > 0 ? baseUrl : DEFAULT_BACKEND_URL,
      timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS
    );
  }

  /**
   * Forward the user message to the backend. The WebView already shows
   * a "thinking" bubble; on success we post the answer, on failure a
   * clear error bubble instead of crashing.
   */
  private async handleUserMessage(text: string): Promise<void> {
    const userText = (text ?? '').trim();
    if (!userText) {
      return;
    }

    try {
      const client = this.resolveBackendClient();
      const reply = await client.sendMessage(userText);
      await this.view?.webview.postMessage({
        type: 'assistantResponse',
        answer: reply.answer,
        english: reply.english
      });
    } catch (error) {
      const message =
        error instanceof BackendError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error while contacting the backend.';
      await this.view?.webview.postMessage({
        type: 'errorResponse',
        text: message
      });
    }
  }

  /** Clears the conversation from the command palette / title bar. */
  public async clearConversation(): Promise<void> {
    await this.view?.webview.postMessage({ type: 'clearConversation' });
  }
}

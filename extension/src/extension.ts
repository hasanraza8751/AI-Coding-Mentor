import * as vscode from 'vscode';
import { MentorViewProvider } from './mentorViewProvider';

/**
 * Extension entry point (Milestone 2: sidebar chat + local backend).
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('AI Coding Mentor extension activated.');

  const provider = new MentorViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      MentorViewProvider.viewId,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiCodingMentor.openMentor', async () => {
      // Focus the sidebar view. The viewId doubles as the focus command
      // target: `aiCodingMentor.chatView.focus`.
      await vscode.commands.executeCommand(
        `${MentorViewProvider.viewId}.focus`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'aiCodingMentor.clearConversation',
      () => {
        void provider.clearConversation();
      }
    )
  );
}

export function deactivate(): void {
  // No cleanup needed for the Milestone 1 shell.
}

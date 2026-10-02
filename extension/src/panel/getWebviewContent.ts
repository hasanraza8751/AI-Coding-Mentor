/**
 * Builds the HTML for the Mentor chat WebView.
 *
 * Kept as a pure function returning a string so the provider stays small
 * and the markup/CSS/client-JS can be reviewed in one place.
 *
 * The client script (embedded below):
 *  - renders user + assistant + error bubbles into #conversation
 *  - renders an optional secondary English-correction card above the answer
 *  - sends { type: 'sendMessage' } to the extension host
 *  - listens for { type: 'assistantResponse' | 'errorResponse' | 'clearConversation' }
 *  - shows a "thinking" bubble while waiting for the backend
 */
export function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"
  />
  <title>AI Coding Mentor</title>
  <style>
    :root {
      color-scheme: light dark;
    }
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      display: flex;
      flex-direction: column;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
    }
    #conversation {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .message {
      max-width: 92%;
      padding: 8px 10px;
      border-radius: 8px;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.4;
    }
    .message.user {
      align-self: flex-end;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .message.assistant {
      align-self: flex-start;
      background: var(--vscode-editorWidget-background, var(--vscode-input-background));
      border: 1px solid var(--vscode-panel-border, var(--vscode-input-border, transparent));
    }
    .message.thinking {
      align-self: flex-start;
      font-style: italic;
      opacity: 0.75;
    }
    .message.error {
      align-self: flex-start;
      color: var(--vscode-errorForeground, #f14c4c);
      background: var(--vscode-inputValidation-errorBackground, transparent);
      border: 1px solid var(--vscode-inputValidation-errorBorder, #f14c4c);
    }
    /* English correction: deliberately secondary to the coding answer. */
    .english-card {
      border-left: 3px solid var(--vscode-textLink-foreground, #4c9aff);
      background: var(--vscode-textBlockQuote-background, transparent);
      padding: 6px 8px;
      margin-bottom: 8px;
      border-radius: 4px;
      font-size: 0.92em;
      opacity: 0.95;
    }
    .english-card .ec-title {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .english-card .ec-row {
      margin: 2px 0;
    }
    .english-card .ec-label {
      font-weight: 600;
    }
    #inputRow {
      display: flex;
      gap: 6px;
      padding: 10px;
      border-top: 1px solid var(--vscode-panel-border, var(--vscode-input-border, transparent));
    }
    #userInput {
      flex: 1;
      resize: none;
      min-height: 36px;
      max-height: 120px;
      padding: 6px 8px;
      font-family: inherit;
      font-size: inherit;
      color: var(--vscode-input-foreground);
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 6px;
    }
    #userInput:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }
    .btn {
      padding: 0 12px;
      min-height: 36px;
      cursor: pointer;
      border-radius: 6px;
      border: 1px solid transparent;
    }
    #sendButton {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    #sendButton:hover {
      background: var(--vscode-button-hoverBackground);
    }
    #sendButton:disabled {
      opacity: 0.6;
      cursor: default;
    }
    #clearButton {
      background: var(--vscode-button-secondaryBackground, transparent);
      color: var(--vscode-button-secondaryForeground, inherit);
      border-color: var(--vscode-input-border, transparent);
    }
  </style>
</head>
<body>
  <div id="conversation" aria-live="polite" aria-label="Conversation area"></div>

  <div id="inputRow">
    <textarea
      id="userInput"
      placeholder="Type your coding question… (Enter to send, Shift+Enter for newline)"
      aria-label="Message input"
    ></textarea>
    <button id="sendButton" class="btn">Send</button>
    <button id="clearButton" class="btn" title="Clear conversation">Clear</button>
  </div>

  <script>
    (function () {
      const vscode = acquireVsCodeApi();
      const conversation = document.getElementById('conversation');
      const userInput = document.getElementById('userInput');
      const sendButton = document.getElementById('sendButton');
      const clearButton = document.getElementById('clearButton');
      let thinkingBubble = null;

      function escapeHtml(text) {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function addMessage(role, text) {
        const div = document.createElement('div');
        div.className = 'message ' + role;
        // textContent is safe against HTML injection.
        const prefix = role === 'user' ? 'You: ' : role === 'error' ? 'Error: ' : 'Mentor: ';
        div.textContent = prefix + text;
        conversation.appendChild(div);
        conversation.scrollTop = conversation.scrollHeight;
        return div;
      }

      function addMentorResponse(answer, english) {
        const div = document.createElement('div');
        div.className = 'message assistant';
        if (english && english.needsCorrection === true) {
          div.appendChild(buildEnglishCard(english));
        }
        const answerEl = document.createElement('div');
        answerEl.className = 'mentor-answer';
        // textContent is safe against HTML injection.
        answerEl.textContent = 'Mentor: ' + String(answer || '');
        div.appendChild(answerEl);
        conversation.appendChild(div);
        conversation.scrollTop = conversation.scrollHeight;
        return div;
      }

      function buildEnglishCard(english) {
        const card = document.createElement('div');
        card.className = 'english-card';
        const title = document.createElement('div');
        title.className = 'ec-title';
        title.textContent = 'English correction';
        card.appendChild(title);
        card.appendChild(buildEnglishRow('Original: ', english.original));
        card.appendChild(buildEnglishRow('Better: ', english.corrected));
        card.appendChild(buildEnglishRow('Why: ', english.explanation));
        return card;
      }

      function buildEnglishRow(label, value) {
        const row = document.createElement('div');
        row.className = 'ec-row';
        const labelEl = document.createElement('span');
        labelEl.className = 'ec-label';
        labelEl.textContent = label;
        row.appendChild(labelEl);
        row.appendChild(document.createTextNode(String(value || '')));
        return row;
      }

      function setThinking(on) {
        if (on && !thinkingBubble) {
          thinkingBubble = document.createElement('div');
          thinkingBubble.className = 'message thinking';
          thinkingBubble.textContent = 'Mentor is thinking…';
          conversation.appendChild(thinkingBubble);
          conversation.scrollTop = conversation.scrollHeight;
          sendButton.disabled = true;
        } else if (!on && thinkingBubble) {
          thinkingBubble.remove();
          thinkingBubble = null;
          sendButton.disabled = false;
        }
      }

      function sendMessage() {
        const text = userInput.value.trim();
        if (!text || sendButton.disabled) {
          return;
        }
        addMessage('user', text);
        userInput.value = '';
        setThinking(true);
        vscode.postMessage({ type: 'sendMessage', text: text });
      }

      function clearConversation() {
        conversation.innerHTML = '';
        setThinking(false);
        addGreeting();
      }

      function addGreeting() {
        addMessage(
          'assistant',
          "Hi! I'm your AI Coding Mentor. Ask a coding question — I'm connected to the local backend."
        );
      }

      sendButton.addEventListener('click', sendMessage);
      clearButton.addEventListener('click', function () {
        clearConversation();
      });

      userInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      window.addEventListener('message', function (event) {
        const msg = event.data;
        if (!msg || !msg.type) {
          return;
        }
        if (msg.type === 'assistantResponse') {
          setThinking(false);
          addMentorResponse(msg.answer, msg.english);
        } else if (msg.type === 'errorResponse') {
          setThinking(false);
          addMessage('error', String(msg.text || 'Backend request failed.'));
        } else if (msg.type === 'clearConversation') {
          clearConversation();
        }
      });

      addGreeting();
      userInput.focus();
    })();
  </script>
</body>
</html>`;
}

# AI Coding Mentor — Extension (Milestone 4)

Sidebar chat UI that calls the local backend over HTTP and renders the
structured mentor response: a secondary English-correction card (shown
only when the backend flags a meaningful mistake) above the primary
coding answer. No voice, RAG, tools, or database — those are later
milestones.

## Prerequisites

- VS Code
- Node.js 18+
- Backend running (see `../server/README.md`)

## Install dependencies

```powershell
cd extension
npm install
```

## Compile

```powershell
npm run compile
```

Output goes to `extension/out/`.

## Configure backend URL

Settings (defaults work for local dev):

- `aiCodingMentor.backendUrl` — default `http://localhost:3000`
- `aiCodingMentor.requestTimeoutMs` — default `120000` (local LLM
  inference can be slow; keep in line with server `OLLAMA_TIMEOUT_MS`)

Must match the server `PORT`.

## Run in VS Code (Extension Development Host)

1. Start the backend first: `cd server; npm run dev`.
2. Open this folder (`Ai-Coding mentor`) in VS Code.
3. Press `F5` (uses `.vscode/launch.json` → Run Extension).
4. A new Extension Development Host window opens.
5. Click the **AI Coding Mentor** icon in the Activity Bar,
   or run `AI Coding Mentor: Open Mentor Chat` from the command palette.
6. Type a message → press **Send** (or `Enter`).
   A "thinking" bubble shows while waiting for `POST /api/chat`.
7. If the backend is down, a red error bubble explains how to start it
   instead of crashing.
8. Press **Clear** (or the trash icon in the view title) to reset.

`Shift+Enter` inserts a newline instead of sending.

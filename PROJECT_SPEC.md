# AI Coding Mentor — Current Development Scope

## Milestone Status

- Milestone 1 — VS Code extension shell: **COMPLETE**
- Milestone 2 — Local Node.js backend (mock responses): **COMPLETE**
- Milestone 3 — Ollama + Qwen3 8B integration: **COMPLETE**
  (tested end-to-end: real Qwen3 answers, follow-up context, clean
  502/503/504 error paths, server stays alive after failures)
- Milestone 4 — Structured English-coach response: **NEXT**

## Current Architecture

```text
VS Code Extension (sidebar WebView)
      ↓ postMessage
BackendClient (extension host, HTTP, 120s default timeout)
      ↓ POST /api/chat { message, conversationId? }
Node.js / Express (server/)
      ↓ MentorService interface
OllamaMentorService ──direct fetch──▶ Ollama (/api/chat, stream:false)
      ↓                                      ↓
{ answer }                               Qwen3 8B (qwen3:8b)
      ↓
VS Code Extension (answer bubble / red error bubble)
```

`MENTOR_PROVIDER=mock` swaps in `MockMentorService` for UI work
without Ollama. Routes never import Ollama code directly.

## Current Features

- VS Code extension with AI Coding Mentor activity view
- Chat-style WebView UI (conversation area, text input, Send, Clear)
- Loading ("thinking") bubble while waiting for the backend
- Red error bubble on backend/model failures (no crashes)
- Backend settings: `aiCodingMentor.backendUrl`, `aiCodingMentor.requestTimeoutMs` (default 120000)
- `GET /health` → `{ "status": "ok" }`
- `POST /api/chat` → `{ "answer": "..." }` (real Qwen3 answer)
- Teacher-first mentor system prompt (`server/src/prompts/mentorSystemPrompt.ts`)
- In-memory bounded conversation history (default last 20 messages),
  scoped per `conversationId`, shared `default` session when omitted
- Ollama config via env: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`,
  `OLLAMA_TIMEOUT_MS` (defaults: `http://localhost:11434`, `qwen3:8b`, `120000`)
- Minimal server logging (request received, Ollama start/complete/fail — no conversation dumps)

## Important Files Added/Modified (Milestone 3)

- `server/src/services/ollamaMentorService.ts` (new) — Ollama HTTP client implementing `MentorService`
- `server/src/services/conversationStore.ts` (new) — in-memory per-session bounded history
- `server/src/prompts/mentorSystemPrompt.ts` (new) — dedicated system prompt
- `server/src/services/mentorService.ts` — interface gained optional `sessionId`; added user-safe `MentorServiceError(statusCode)`; mock kept for `MENTOR_PROVIDER=mock`
- `server/src/config.ts` — `getOllamaConfig()`, `getHistoryLimit()`, `getMentorProvider()`
- `server/src/routes/chat.ts` — accepts optional `conversationId`, forwards service status codes, logs receipt
- `server/src/server.ts` — provider selection + startup logging
- `server/src/types/index.ts` — `conversationId` on chat request body
- `server/.env.example` — Ollama + provider + history variables
- `server/README.md` — Ollama/Qwen3 setup, env docs, tests, troubleshooting
- `extension/src/mentorViewProvider.ts`, `extension/src/services/backendClient.ts`, `extension/package.json` — request timeout default raised 15s → 120s for local LLM latency (no other extension changes)

## Error Handling (Implemented)

- Ollama down → `503` with start-Ollama guidance
- Model missing → `502` with `ollama pull <model>` guidance
- Ollama timeout → `504`, AbortController-based, configurable
- Malformed/empty model response → `502`, no stack-trace leaks
- Invalid request body → `400`; unknown routes → `404`
- Node process never crashes on model failures; extension shows existing error bubble

## Not Implementing Yet

- Structured English correction (Milestone 4)
- Response streaming
- Voice input/output (Whisper, Piper, STT, TTS)
- RAG / vector database / embeddings / codebase analysis
- Agent tools / terminal execution / autonomous edits
- SQLite / persistent memory / Redis / PostgreSQL
- Authentication, cloud AI APIs, GitHub integration, web search
- Multi-agent architecture, WebSockets

## Technology

- TypeScript (strict)
- VS Code Extension API + WebView
- Node.js + Express backend (direct `fetch` to Ollama, no SDK)
- Ollama + Qwen3 8B (local inference)

## Development Rules

- Keep architecture modular
- Use TypeScript strict mode
- Avoid unnecessary dependencies
- Keep functions small and understandable
- Do not build future features prematurely
- Explain important implementation decisions

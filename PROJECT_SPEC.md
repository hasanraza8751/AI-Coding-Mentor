# AI Coding Mentor — Current Development Scope

## Milestone Status

- Milestone 1 — VS Code extension shell: **COMPLETE**
- Milestone 2 — Local Node.js backend (mock responses): **COMPLETE**
- Milestone 3 — Ollama + Qwen3 8B integration: **COMPLETE**
  (tested end-to-end: real Qwen3 answers, follow-up context, clean
  502/503/504 error paths, server stays alive after failures)
- Milestone 4 — Structured English-coach response: **COMPLETE**
  (tested end-to-end: correction shown when needed, hidden when not,
  follow-up context preserved, parser fallback unit-tested 6/6,
  Ollama-down 503, mock structured response, both projects compile)
- Milestone 5 — TBD: **NEXT**

## Current Architecture

```text
VS Code Extension (sidebar WebView)
      ↓ postMessage
BackendClient (extension host, HTTP, 120s default timeout)
      ↓ POST /api/chat { message, conversationId? }
Node.js / Express (server/)
      ↓ MentorService interface (returns MentorResponse)
OllamaMentorService ──direct fetch──▶ Ollama (/api/chat, stream:false, format:json)
      ↓ validation + fallback              ↓
{ english, answer }                    Qwen3 8B (qwen3:8b)
      ↓
VS Code Extension (English card + answer / red error bubble)
```

`MENTOR_PROVIDER=mock` swaps in `MockMentorService` (also structured)
for UI work without Ollama. Routes never import Ollama code directly.

## Current Features

- VS Code extension with AI Coding Mentor activity view
- Chat-style WebView UI (conversation area, text input, Send, Clear)
- Loading ("thinking") bubble while waiting for the backend
- Secondary English-correction card (Original / Better / Why) shown
  only when `needsCorrection` is true; hidden otherwise
- Coding answer always shown as the primary content
- Red error bubble on backend/model failures (no crashes)
- Backend settings: `aiCodingMentor.backendUrl`, `aiCodingMentor.requestTimeoutMs` (default 120000)
- `GET /health` → `{ "status": "ok" }`
- `POST /api/chat` → `{ "english": { "needsCorrection": bool,
  "original": string, "corrected": string, "explanation": string },
  "answer": string }` (real Qwen3 structured answer)
- Dual-role mentor system prompt: coding help primary, concise
  selective English coaching secondary, JSON-only output, no invented
  corrections (`server/src/prompts/mentorSystemPrompt.ts`)
- Backend validation of model JSON (`server/src/services/mentorResponseParser.ts`):
  boolean + string checks, `true`-without-correction downgraded,
  length caps (300/300/500), `<think>`/fence stripping, `{...}`
  extraction; safe fallback (salvaged text or generic message)
- In-memory bounded conversation history (default last 20 messages,
  plain answers stored), scoped per `conversationId`, shared `default`
  session when omitted
- Ollama config via env: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`,
  `OLLAMA_TIMEOUT_MS` (defaults: `http://localhost:11434`, `qwen3:8b`, `120000`)
- Minimal server logging (request received, Ollama start/complete/fail,
  parse-fallback reason tag — no conversation dumps)

## Important Files Added/Modified (Milestone 4)

- `server/src/types/index.ts` — `EnglishCorrection`, `MentorResponse`,
  `ChatSuccessResponse = MentorResponse`, `EMPTY_ENGLISH_CORRECTION`
- `server/src/services/mentorResponseParser.ts` (new) — validation +
  fallback, no `any` (type-guard narrowing)
- `server/src/services/mentorService.ts` — interface returns
  `MentorResponse`; mock returns structured no-correction response
- `server/src/prompts/mentorSystemPrompt.ts` — dual-role prompt with
  JSON schema, correction policy, no-fences rule
- `server/src/services/ollamaMentorService.ts` — `format: "json"`,
  parse + fallback warn-log, stores plain answer in history
- `server/src/routes/chat.ts` — returns `{ english, answer }` (same endpoint)
- `server/README.md` — structured schema, validation/fallback, new tests
- `extension/src/types/index.ts` — `EnglishCorrection`, `MentorResponse`,
  structured `assistantResponse` message
- `extension/src/services/backendClient.ts` — returns `MentorResponse`,
  normalizes correction block (falls back to no-correction)
- `extension/src/mentorViewProvider.ts` — forwards `{ answer, english }`
- `extension/src/panel/getWebviewContent.ts` — `.english-card` styles +
  `addMentorResponse()`/`buildEnglishCard()` rendering (textContent-only)
- `extension/README.md` — Milestone 4 description, 120s timeout note

## Tests Performed (Milestone 4)

Environment: Ollama 0.34.4, `qwen3:8b` present. Both `tsc` builds pass.
Main server on :3000, isolated `conversationId` per test:

- TEST 1 correction needed ("How I can implement authentication in
  React?") → 200, `needsCorrection: true` + natural fix + answer. PASS
- TEST 2 clean English ("What is a JavaScript closure?") → 200,
  `needsCorrection: false`, empty fields, useful answer. PASS
- TEST 3 follow-up ("What is JWT?" → "How do I store it?") → 200,
  "it" resolved to JWT. PASS
- TEST 4 casual language ("bro why this code not work") → 200, one
  short correction + coding answer, no grammar lecture. PASS
- TEST 5 parser unit tests vs built `dist` (garbage / fenced /
  think-tags / schema-garbage / true-without-correction / empty) →
  6/6 correct fallback or recovery, no throws. PASS
- TEST 6 Ollama down (dead port instance) → 503 clean JSON. PASS
- TEST 7 normal question (promises + example) → 200,
  `needsCorrection: false`, useful answer with example. PASS (retry;
  first two attempts hit the 120s Ollama timeout on long generations —
  timeout path itself returned clean 504 and the server stayed alive)
- Regression: main server healthy after 504s/failures; mock provider
  returns valid structured response; WebView client script passes
  `node --check`. In-VS Code click-through not run (no GUI here);
  protocol verified at HTTP level.

## Error Handling (Implemented)

- Ollama down → `503` with start-Ollama guidance
- Model missing → `502` with `ollama pull <model>` guidance
- Ollama timeout → `504`, AbortController-based, configurable
- Malformed/empty model response → `502`, no stack-trace leaks
- Invalid structured JSON/schema → salvaged fallback `200`
  (`needsCorrection: false` + usable answer), reason-tagged warn log
- Invalid request body → `400`; unknown routes → `404`
- Node process never crashes on model failures; extension shows existing error bubble

## Not Implementing Yet

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

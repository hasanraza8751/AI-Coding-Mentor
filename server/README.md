# AI Coding Mentor — Local Backend (Milestone 4)

Express + TypeScript server. The mentor answers come from **Qwen3 8B via
local Ollama** through the `MentorService` interface and are returned
as a **structured response**: a concise English correction (only when
meaningful) plus the coding answer. No voice, RAG,
tools, SQLite, auth, or cloud APIs.

## Endpoints

- `GET /health` → `{ "status": "ok" }`
- `POST /api/chat` with `{ "message": "...", "conversationId"?: "..." }`
  → `{ "english": { "needsCorrection": bool, "original": "...",
  "corrected": "...", "explanation": "..." }, "answer": "..." }`
  - `400` when `message` is missing, not a string, or empty
  - `502` Ollama error / model missing / malformed model response
  - `503` Ollama not reachable
  - `504` Ollama request timeout
  - `500` unexpected errors
  - `404` JSON `{ "error": "Not found." }` for unknown routes

## Structured response

The model must return a single JSON object; the backend validates it
(`server/src/services/mentorResponseParser.ts`):

- `english.needsCorrection` must be boolean
- `english.original/corrected/explanation` must be strings
  (a `true` without a corrected sentence is downgraded to `false`)
- `answer` must be a non-empty string

Fallback (never crashes, never leaks parse errors): unparseable or
off-schema output is salvaged — non-empty raw text becomes the answer
with `needsCorrection: false`; otherwise a short generic message is
returned. Failures are logged server-side with a short reason tag only.

## Prerequisites

- Node.js 18+
- Ollama installed and running
- Model pulled: `ollama pull qwen3:8b`

Verify Ollama and the model:

```powershell
ollama --version
ollama list            # must include qwen3:8b
ollama serve           # only if Ollama is not already running
```

## Install

```powershell
cd server
npm install
```

## Configure

```powershell
Copy-Item .env.example .env
```

`.env` example:

```text
PORT=3000
MENTOR_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
OLLAMA_TIMEOUT_MS=120000
CONVERSATION_HISTORY_LIMIT=20
```

- `MENTOR_PROVIDER=mock` falls back to the stub (UI testing without Ollama).
- The extension defaults to `http://localhost:3000` — keep `PORT` in sync.
- History is in-memory only (cleared on restart); `conversationId`
  scopes it per client, omitted means the shared `default` session.

## Run

```powershell
npm run dev
# or: npm run build + npm start
```

## Test

```powershell
Invoke-RestMethod http://localhost:3000/health
# Correction case (needsCorrection=true expected):
Invoke-RestMethod -Method Post http://localhost:3000/api/chat `
  -ContentType 'application/json' `
  -Body '{"message":"How I can implement authentication in React? Keep the answer short."}'
# Clean-English case (needsCorrection=false expected):
Invoke-RestMethod -Method Post http://localhost:3000/api/chat `
  -ContentType 'application/json' `
  -Body '{"message":"What is a JavaScript closure? Keep the answer short."}'
# Follow-up uses conversation context:
Invoke-RestMethod -Method Post http://localhost:3000/api/chat `
  -ContentType 'application/json' `
  -Body '{"message":"What is JWT? Keep answers short.", "conversationId":"demo"}'
Invoke-RestMethod -Method Post http://localhost:3000/api/chat `
  -ContentType 'application/json' `
  -Body '{"message":"How do I store it?", "conversationId":"demo"}'
```

## Compile the extension

```powershell
cd ../extension
npm install
npm run compile
```

## Run the complete system

1. Start Ollama (`ollama serve` if needed) and confirm `qwen3:8b` in `ollama list`.
2. `cd server; npm run dev`.
3. Open the project folder in VS Code, press `F5`.
4. In the Extension Development Host, open the **AI Coding Mentor**
   activity view and send a message. First answers can take ~1 min
   (cold model load); errors appear as red bubbles, never a crash.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `503 Ollama is not reachable` | Start Ollama: `ollama serve`; check `OLLAMA_BASE_URL` |
| `502 model ... was not found` | Run `ollama pull qwen3:8b`; check `OLLAMA_MODEL` / `ollama list` |
| `504 timed out` | Model still loading or slow hardware; retry, or raise `OLLAMA_TIMEOUT_MS` |
| `400 Invalid request` | `message` must be a non-empty string |
| Extension timeout bubble | Raise `aiCodingMentor.requestTimeoutMs` (default 120000) to match `OLLAMA_TIMEOUT_MS` |

## Architecture note

Routes depend only on the `MentorService` interface
(`src/services/mentorService.ts`), which now returns `MentorResponse`.
`OllamaMentorService` (`src/services/ollamaMentorService.ts`) implements
it with direct `fetch` calls to Ollama's `/api/chat` (`format: "json"`,
validated by `src/services/mentorResponseParser.ts`) plus a per-session
`ConversationStore` holding plain answers. The dual-role system prompt
lives in `src/prompts/mentorSystemPrompt.ts`.

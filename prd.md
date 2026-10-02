# PRD — AI Coding Mentor

**Project Name:** AI Coding Mentor  
**Working Title:** Voice-first AI Coding Mentor & English Communication Coach  
**Document Version:** 1.0  
**Status:** Initial Product Requirements Document  
**Target Platform:** Visual Studio Code  
**Primary Runtime:** Local-first  
**Initial AI Model:** Qwen3 8B via Ollama  

---

## 1. Product Overview

AI Coding Mentor is a local-first VS Code extension that acts as a personal coding mentor while a developer is working inside VS Code.

The product combines four capabilities into one workflow:

1. **Coding mentorship** — answer programming questions, explain concepts, debug errors, and guide the user toward understanding rather than blindly generating code.
2. **English communication coaching** — detect meaningful English mistakes in the user's questions and provide concise corrections without disrupting the coding conversation.
3. **Voice interaction** — allow the user to speak naturally to the mentor and receive spoken responses.
4. **VS Code context awareness** — progressively understand the current file, selected code, diagnostics, project structure, and other relevant development context.

The product is designed around a simple interaction model:

> **Ask → Understand → Correct English (when needed) → Mentor → Explain → Act**

The initial version will be deliberately small. The project should first prove the core mentor experience with text and a local LLM before adding speech, codebase awareness, tools, memory, or autonomous actions.

---

## 2. Problem Statement

Developers often switch between multiple tools while coding:

- a browser or chat application for programming questions,
- documentation for technical concepts,
- a debugger for errors,
- a separate English-learning resource for communication improvement,
- and sometimes another application for voice interaction.

This fragmented workflow creates context switching and makes it difficult to learn while building.

For learners, there is an additional problem: they may know what they want to ask technically but struggle to express the question clearly in English. A useful mentor should help improve the communication without making the user feel interrupted or judged.

The product aims to create a single development companion inside VS Code that can understand a user's coding question, optionally correct the English, explain the solution, and later use the user's actual project context to provide more relevant guidance.

---

## 3. Product Vision

Build a personal AI mentor that lives inside the developer's IDE and behaves more like a patient senior developer than a generic chatbot.

The long-term vision is:

> **A private, voice-first, context-aware AI development mentor that teaches the developer while they build software.**

The mentor should eventually be able to understand the user's codebase, explain why something is wrong, suggest implementation strategies, teach relevant concepts, help practice technical communication, and maintain a lightweight learning history — while keeping the user in control of code changes and system actions.

---

## 4. Goals

### 4.1 Primary Goals

- Create a VS Code-native mentor experience.
- Run the initial AI stack locally using Ollama and Qwen3.
- Support conversational coding questions.
- Correct meaningful English mistakes in the user's technical questions.
- Keep English feedback concise and separate from the technical answer.
- Preserve conversation context during the active session.
- Establish a modular architecture that can later support voice, code context, tools, and memory.
- Keep the initial product understandable and maintainable by a student developer.

### 4.2 Secondary Goals

- Add speech-to-text for hands-free questions.
- Add text-to-speech for spoken answers.
- Understand selected code and the active editor.
- Read relevant project files when explicitly requested or when the user grants permission.
- Surface compiler/linter/runtime diagnostics.
- Introduce safe developer tools such as file search and test execution.
- Store useful learning history locally.

### 4.3 Non-Goals for the Initial MVP

The MVP will NOT attempt to implement:

- autonomous code modification,
- autonomous terminal commands,
- automatic Git commits or pushes,
- GitHub integration,
- web search,
- cloud AI APIs,
- multi-agent orchestration,
- vector databases or RAG over a large codebase,
- long-term personal memory,
- fully automatic always-listening voice interaction,
- enterprise authentication,
- multi-user collaboration.

These may be evaluated later after the core experience is stable.

---

## 5. Target Users

### Primary User

A student, junior developer, or self-taught developer who works in VS Code and wants continuous technical guidance while learning and building projects.

### Secondary Users

- developers improving technical English,
- developers who prefer voice interaction,
- programmers working primarily with JavaScript/TypeScript, Python, Java, C/C++, or web technologies,
- users who want a private local AI assistant.

### User Characteristics

The initial product should assume that users may:

- ask incomplete questions,
- make grammar mistakes,
- mix technical terms with informal language,
- ask follow-up questions rather than writing long prompts,
- need explanations at beginner or intermediate level,
- not know exactly what information the AI needs to solve a problem.

The mentor should handle these behaviors gracefully.

---

## 6. Core User Experience

### Example Interaction

User says/types:

> "How I can implement authentication in my React application?"

Mentor should respond in two logical sections:

**English correction**

> **Better:** How can I implement authentication in my React application?
>
> **Why:** In a question with “can”, the modal verb comes before the subject.

**Coding mentor**

> You can implement authentication by separating the flow into login, token/session management, protected routes, and logout. For a React application, a common approach is ...

The mentor should answer the coding question even when the English needs correction.

### Mentor Personality

The assistant should be:

- patient,
- practical,
- encouraging,
- technically clear,
- concise by default,
- willing to explain fundamentals,
- non-judgmental about English mistakes,
- focused on teaching rather than showing off.

The assistant should avoid:

- correcting every informal phrase,
- unnecessary grammar lectures,
- excessively long answers to simple questions,
- blindly generating large code blocks when an explanation would be more useful,
- pretending it has access to files or tools it did not receive.

---

## 7. Functional Requirements

## 7.1 VS Code Extension

### FR-001 — Extension Activation

The system shall provide a VS Code extension that can be installed and launched from the VS Code Activity Bar or command palette.

### FR-002 — Mentor View

The extension shall provide a dedicated **Mentor** view/sidebar or panel.

The initial panel should contain:

- conversation history,
- user input box,
- send button,
- loading/generation state,
- English correction section,
- mentor answer section,
- error state,
- optional microphone button placeholder for future voice support.

### FR-003 — Text Input

The user shall be able to type a coding question and submit it without leaving VS Code.

### FR-004 — Conversation History

The UI shall display the current conversation in chronological order.

The MVP only needs session-level history. Persistent history is a later feature.

### FR-005 — Clear Conversation

The user shall be able to clear the current conversation.

### FR-006 — Loading State

The UI shall clearly indicate when the AI is generating a response.

### FR-007 — Error Handling

The UI shall show an understandable error message when:

- the local backend is unavailable,
- Ollama is unavailable,
- the selected model is missing,
- the request times out,
- malformed AI output is returned.

The error message should provide an actionable next step where possible.

---

## 7.2 Local Backend

### FR-008 — Local Server

The product shall include a local Node.js backend responsible for communicating between the VS Code extension and the local AI services.

Initial request flow:

```text
VS Code Extension
       ↓
Local Node.js Backend
       ↓
Ollama HTTP API
       ↓
Qwen3 8B
       ↓
Local Backend
       ↓
VS Code Extension
```

### FR-009 — API Boundary

The backend shall expose a small internal API for the extension.

Initial endpoint example:

```text
POST /api/chat
```

Example request:

```json
{
  "message": "How I can implement authentication in React?",
  "conversationId": "session-123",
  "context": {}
}
```

### FR-010 — Configuration

The backend shall not hardcode environment-specific configuration.

Configuration should support values such as:

- backend port,
- Ollama base URL,
- model name,
- request timeout,
- maximum conversation history.

Example environment variables:

```text
PORT=3000
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:8b
```

---

## 7.3 Local LLM Integration

### FR-011 — Ollama Integration

The system shall communicate with Ollama through its local API.

### FR-012 — Qwen3 Support

The initial configured model shall be Qwen3 8B.

The architecture should keep the model configurable so that another Ollama model can be substituted later without redesigning the application.

### FR-013 — Prompt Construction

The backend shall construct a system prompt defining the assistant's role as:

- coding mentor,
- English communication coach,
- context-aware assistant,
- teacher-first helper.

### FR-014 — Conversation Context

The backend shall send relevant previous messages to Qwen3 so that follow-up questions such as:

> "Why should I use JWT here?"

can be understood in relation to the previous discussion.

### FR-015 — Response Streaming

The architecture should support streamed LLM responses where practical so the UI can display output progressively rather than waiting for the entire response.

The first implementation may use a normal request/response path, but streaming should not be prevented by the architecture.

---

## 7.4 Structured Mentor Response

### FR-016 — Structured Output

The model response should follow a predictable structure.

Recommended logical schema:

```json
{
  "english": {
    "needsCorrection": true,
    "original": "How I can implement this?",
    "corrected": "How can I implement this?",
    "explanation": "In this question, the modal verb 'can' comes before the subject."
  },
  "answer": "You can implement this by ..."
}
```

### FR-017 — No-Correction State

When the user's English is already acceptable, the response should contain:

```json
{
  "english": {
    "needsCorrection": false,
    "original": null,
    "corrected": null,
    "explanation": null
  },
  "answer": "..."
}
```

The UI should avoid showing an empty or distracting grammar card in this case.

### FR-018 — Fallback Handling

If Qwen3 returns invalid JSON or an unexpected structure, the backend shall gracefully fall back to a plain-text response rather than crashing the application.

---

## 7.5 English Coaching

### FR-019 — Meaningful Corrections Only

The system shall prioritize meaningful grammar or phrasing mistakes that improve clarity.

It should generally ignore:

- harmless slang,
- informal wording,
- punctuation differences that do not affect meaning,
- stylistic preferences,
- minor imperfections during rapid voice input.

### FR-020 — Concise Explanation

Each correction should include a short explanation rather than a full grammar lesson unless the user asks for one.

### FR-021 — Technical Terminology Preservation

The mentor shall preserve correct technical vocabulary.

For example:

> "How I use useState hook?"

should be corrected as language, but terms such as `useState`, `React`, `API`, `JWT`, `MongoDB`, etc. must not be incorrectly altered.

### FR-022 — Learning-Oriented Feedback

Repeated mistakes may later be tracked so that the system can identify patterns such as:

- question formation,
- articles,
- prepositions,
- verb tense,
- subject-verb agreement.

This tracking is outside MVP persistent memory but should be considered in the data model.

---

## 7.6 Voice Interaction — Phase 2+

### FR-023 — Push-to-Talk

The first voice implementation shall use a push-to-talk interaction rather than always-listening mode.

Expected flow:

```text
Press microphone
      ↓
Speak
      ↓
Stop recording
      ↓
Speech-to-Text
      ↓
LLM
      ↓
Response
```

### FR-024 — Speech-to-Text

The system should use a local speech recognition engine such as **faster-whisper**.

### FR-025 — Voice Language Handling

The voice layer should eventually tolerate mixed speech, including technical English and informal Hindi/Hinglish.

### FR-026 — Text-to-Speech

The system should eventually support local text-to-speech using a tool such as **Piper**.

### FR-027 — Audio Response

The user should be able to hear the mentor's response without leaving VS Code.

### FR-028 — Interruptibility

A later version should allow the user to stop speech playback when the answer is too long.

---

## 7.7 VS Code Context Awareness — Phase 3+

### FR-029 — Active Editor Context

The system should be able to access, with appropriate user control:

- active file name,
- programming language,
- selected text,
- relevant surrounding code.

### FR-030 — Selection-Based Questions

Example:

User selects a function and asks:

> "Why is this function returning undefined?"

The mentor should receive the selected code as context.

### FR-031 — Diagnostics

The system should eventually be able to access VS Code diagnostics such as:

- TypeScript errors,
- ESLint errors,
- compiler errors,
- warnings.

### FR-032 — Project Context

Later versions may provide controlled access to:

- file tree,
- package.json,
- configuration files,
- relevant source files.

The system should send only relevant context rather than the entire repository on every request.

---

## 7.8 Developer Tools / Agent Capabilities — Phase 4+

The product may eventually expose controlled tools to the AI.

Initial safe tools:

```text
read_file(path)
search_files(query)
get_diagnostics()
get_active_file()
get_selected_code()
```

Later tools may include:

```text
run_tests()
run_linter()
run_build()
```

Potentially destructive operations such as writing files should require explicit user approval.

The AI must never silently modify source code or execute destructive commands in the early versions.

---

## 7.9 Memory — Phase 5+

The product may later provide local persistent memory using SQLite.

Possible information:

- preferred explanation level,
- technologies being learned,
- recurring English mistakes,
- concepts already studied,
- recent project context,
- learning milestones.

Memory should be transparent and controllable by the user.

The user should eventually be able to inspect or clear stored memory.

---

## 8. User Stories

### US-001 — Ask a Coding Question

**As a developer**, I want to ask a programming question inside VS Code so that I do not have to switch to another application.

**Acceptance Criteria:**

- Mentor panel is open.
- User can type a question.
- User submits the question.
- Local AI returns an answer.
- Answer appears in the conversation.

### US-002 — Correct My English

**As a learner**, I want meaningful English mistakes in my technical questions to be corrected so that my communication improves while I code.

**Acceptance Criteria:**

- Original wording is preserved.
- Corrected version is shown when necessary.
- Explanation is concise.
- Coding answer is still provided.

### US-003 — Maintain Context

**As a developer**, I want the mentor to remember the current conversation so that I can ask follow-up questions naturally.

### US-004 — Speak Instead of Type

**As a developer**, I want to speak my question so that I can interact naturally while coding.

### US-005 — Ask About Selected Code

**As a developer**, I want to select code and ask the mentor about it so that the explanation is based on what I am actually working on.

### US-006 — Understand Errors

**As a learner**, I want the mentor to explain my VS Code errors in simple terms and suggest a debugging path.

### US-007 — Learn, Not Just Copy

**As a learner**, I want explanations and reasoning so that I understand the solution rather than repeatedly copying generated code.

---

## 9. User Interface Requirements

### 9.1 Mentor Panel

Suggested initial layout:

```text
┌───────────────────────────────────┐
│ AI CODING MENTOR                  │
├───────────────────────────────────┤
│                                   │
│ Mentor:                           │
│ What are you working on today?    │
│                                   │
│ You:                              │
│ How I can implement auth in React?│
│                                   │
│ English                           │
│ Better: How can I implement... ?  │
│ Why: ...                          │
│                                   │
│ Mentor                            │
│ You can implement authentication  │
│ using...                          │
│                                   │
├───────────────────────────────────┤
│ [ Type your question...       ]   │
│                        [🎤] [→]    │
└───────────────────────────────────┘
```

### 9.2 UI Principles

- Minimal interface.
- Fast access to input.
- Clear distinction between user and mentor messages.
- English correction should be visible but secondary to the coding answer.
- Avoid unnecessary dashboards in the MVP.
- Show system state clearly: thinking, generating, listening, speaking, error.

### 9.3 Future UI Elements

Possible later additions:

- microphone recording indicator,
- stop speaking button,
- context indicator,
- selected-file indicator,
- diagnostics panel,
- tool approval dialog,
- learning progress section,
- settings page.

---

## 10. System Architecture

### 10.1 MVP Architecture

```text
                    VS CODE
        ┌───────────────────────────┐
        │                           │
        │  Developer Code           │
        │                           │
        │  AI Mentor WebView        │
        │                           │
        └─────────────┬─────────────┘
                      │
                HTTP / WebSocket
                      │
                      ▼
        ┌───────────────────────────┐
        │   LOCAL NODE.JS SERVER    │
        │                           │
        │ API / Session / Prompting │
        └─────────────┬─────────────┘
                      │
                      ▼
        ┌───────────────────────────┐
        │       OLLAMA              │
        │                           │
        │       Qwen3 8B            │
        └───────────────────────────┘
```

### 10.2 Voice Architecture

```text
🎤 Microphone
      │
      ▼
Speech-to-Text
(faster-whisper)
      │
      ▼
Node.js Backend
      │
      ▼
Qwen3 via Ollama
      │
      ▼
Response Formatter
      │
      ▼
Text-to-Speech
(Piper)
      │
      ▼
🔊 Speaker
```

### 10.3 Future Context Architecture

```text
VS Code
  │
  ├── Active File
  ├── Selection
  ├── Diagnostics
  └── Workspace Metadata
          │
          ▼
     Context Manager
          │
          ▼
     AI Orchestrator
          │
     ┌────┼─────────────┐
     ▼    ▼             ▼
   LLM  Tools        Memory
     │
     ▼
 Response Formatter
```

---

## 11. Technology Stack

### Frontend / Extension

- Visual Studio Code Extension API
- TypeScript
- WebView for the mentor UI
- HTML/CSS/TypeScript initially
- React optional for later UI complexity

### Backend

- Node.js
- TypeScript
- Lightweight HTTP API initially
- WebSocket support when real-time streaming/voice is introduced

### Local AI

- Ollama
- Qwen3 8B

### Speech — Later Phase

- faster-whisper for speech-to-text
- Piper for text-to-speech

### Persistence — Later Phase

- SQLite

### Development Tools

- Git
- GitHub
- VS Code
- npm

---

## 12. Project Structure

Recommended structure:

```text
AI-Coding-Mentor/
│
├── extension/
│   ├── src/
│   │   ├── extension.ts
│   │   ├── panel/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── server/
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   ├── services/
│   │   ├── prompts/
│   │   ├── llm/
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
│
├── ai/
│   ├── prompts/
│   └── schemas/
│
├── docs/
│   └── architecture.md
│
├── PROJECT_SPEC.md
├── PRD.md
├── README.md
├── .gitignore
└── package.json
```

The structure may evolve as the project grows, but extension, backend, AI prompting, and documentation should remain conceptually separated.

---

## 13. API Design — Initial Draft

### POST /api/chat

Request:

```json
{
  "conversationId": "session-123",
  "message": "How I can implement authentication in React?",
  "context": {
    "language": "typescript",
    "fileName": "Login.tsx",
    "selectedCode": null
  }
}
```

Response:

```json
{
  "conversationId": "session-123",
  "english": {
    "needsCorrection": true,
    "original": "How I can implement authentication in React?",
    "corrected": "How can I implement authentication in React?",
    "explanation": "In this question, 'can' comes before the subject 'I'."
  },
  "answer": "A common approach is to separate authentication into login, session management, protected routes, and logout."
}
```

### GET /health

The endpoint should indicate whether the local backend is running.

Example:

```json
{
  "status": "ok"
}
```

### Future Endpoints

Potential future routes:

```text
POST /api/transcribe
POST /api/speak
GET  /api/context
POST /api/tools/execute
GET  /api/memory
DELETE /api/memory
```

These are design placeholders, not MVP requirements.

---

## 14. Prompt Requirements

The core system prompt should establish the following behavior:

```text
You are an AI coding mentor integrated into VS Code.

Your responsibilities are:
1. Help the user understand programming concepts and solve development problems.
2. Explain reasoning clearly and teach instead of blindly generating code.
3. Correct meaningful English mistakes in the user's technical messages.
4. Keep English corrections concise and do not interrupt the technical answer.
5. Preserve technical terms exactly when they are valid.
6. Use the provided code/context only; never claim access to information you were not given.
7. Ask for missing information when necessary.
8. Prefer practical examples and incremental explanations.
9. Adapt explanations to the apparent skill level of the user.
10. Return the required structured response format.
```

Prompt design should be maintained separately from application logic so it can be iterated and tested independently.

---

## 15. English Correction Policy

The mentor should use a correction threshold rather than correcting every sentence.

### Correct when:

- the sentence contains a clear grammar mistake,
- the mistake affects clarity,
- the same mistake appears repeatedly,
- a simple alternative is substantially more natural for technical communication.

### Do not correct when:

- the phrase is intentionally informal,
- the wording is understandable and technically appropriate,
- the change is purely stylistic,
- the user is rapidly speaking and small transcription imperfections are obvious.

### Example

User:

> "Why this code not work?"

Correction:

> **Better:** Why doesn't this code work?

Then continue with the debugging explanation.

---

## 16. Coding Mentor Behavior

The mentor should generally follow this response strategy:

```text
1. Understand the user's objective.
2. Identify missing information.
3. Correct meaningful English when needed.
4. Answer the immediate technical question.
5. Explain the underlying concept.
6. Give a small example when helpful.
7. Mention common pitfalls.
8. Suggest a next debugging/learning step when appropriate.
```

The mentor should avoid unnecessarily solving a completely different problem than the one asked.

### Teaching-first principle

For educational questions, prioritize:

> **Understand → Implement → Practice**

rather than:

> **Generate huge code → Copy → Move on**

When the user explicitly requests complete code, complete code can be provided, but it should remain understandable.

---

## 17. Security and Privacy Requirements

Because the product is local-first, the MVP should keep data processing on the local machine whenever possible.

### Requirements

- No API key should be required for local Qwen inference.
- The extension should not upload source code to a remote service in the MVP.
- The backend should bind to localhost by default.
- The extension should not expose the local server publicly by default.
- Tool execution must require explicit design and permission controls.
- Destructive actions should require user confirmation.
- Stored memory should remain local.
- Users should be able to clear local conversation or memory data.

### Sensitive Data Handling

The assistant may encounter secrets in source code or environment files. Future context features should avoid sending files such as `.env`, credentials, private keys, or unrelated secret-bearing files unless the user explicitly requests it.

---

## 18. Performance Requirements

The assistant should feel interactive even when local model inference is slower than cloud AI.

### MVP Targets

These are engineering targets rather than guarantees:

- Extension UI should open quickly.
- User input should be acknowledged immediately.
- Loading state should appear without perceptible delay.
- Responses should support streaming where possible.
- The architecture should allow response latency measurement for:
  - request overhead,
  - LLM time to first token,
  - total generation time.

### Voice Targets — Future

Measure the complete pipeline:

```text
Speech capture
→ STT
→ LLM time-to-first-token
→ response generation
→ TTS startup
→ audio playback
```

Optimization priorities should include:

- short system prompts,
- concise default responses,
- no unnecessary reasoning for simple queries,
- streaming output,
- appropriate local model configuration,
- avoiding repeated transmission of irrelevant context.

---

## 19. Reliability Requirements

The application should fail gracefully.

### Example Failure States

**Ollama not running**

Show:

> Ollama is unavailable. Start Ollama and try again.

**Qwen model missing**

Show:

> The configured model was not found. Check the Ollama model configuration.

**Invalid AI response**

Use a plain-text fallback and log the parsing failure for debugging.

**Backend unavailable**

Show a connection error and provide the backend startup command in developer documentation.

---

## 20. Observability / Debugging

The system should provide development-time logs for:

- extension activation,
- backend connection status,
- request duration,
- model name,
- response parsing failures,
- STT/TTS errors in later versions.

Logs must not unnecessarily dump complete source code, secrets, or sensitive user content.

A future diagnostics screen may expose performance metrics such as:

```text
LLM Time to First Token: 1.8s
Total LLM Generation: 5.4s
STT: 0.9s
TTS Startup: 0.4s
```

---

## 21. Milestones

## Milestone 0 — Project Setup

Deliverables:

- repository initialized,
- `PRD.md`,
- `PROJECT_SPEC.md`,
- `.gitignore`,
- extension and server directories,
- development instructions.

Success condition:

The project structure is clean and reproducible.

---

## Milestone 1 — VS Code Mentor Shell

Deliverables:

- TypeScript VS Code extension,
- Mentor sidebar/panel,
- chat UI,
- text input,
- send button,
- conversation rendering,
- loading state,
- error state.

No AI integration yet.

Success condition:

The user can launch the extension and interact with a mock mentor response inside VS Code.

---

## Milestone 2 — Local Node.js Backend

Deliverables:

- local Node.js server,
- `/health`,
- `/api/chat`,
- extension-to-server communication,
- configuration handling,
- clean error responses.

Success condition:

The VS Code extension can send a message to the local backend and receive a response.

---

## Milestone 3 — Ollama + Qwen3

Deliverables:

- Ollama connection,
- Qwen3 model configuration,
- system prompt,
- conversation context,
- response handling.

Success condition:

The user can hold a useful text conversation with Qwen3 through the VS Code extension.

---

## Milestone 4 — English Coach

Deliverables:

- structured response schema,
- English correction section,
- coding answer section,
- correction threshold behavior,
- JSON validation/fallback.

Success condition:

The mentor can correct meaningful English errors while answering the technical question.

---

## Milestone 5 — Voice Input

Deliverables:

- microphone button,
- audio capture,
- faster-whisper integration,
- transcript display,
- transcript editing/retry.

Success condition:

The user can press a button, speak, and send the recognized question to the mentor.

---

## Milestone 6 — Voice Output

Deliverables:

- Piper integration,
- spoken response,
- playback controls,
- stop button.

Success condition:

The user can interact with the mentor using speech input and spoken output.

---

## Milestone 7 — VS Code Context

Deliverables:

- active file context,
- selected code context,
- language metadata,
- diagnostics,
- context controls.

Success condition:

The mentor can answer questions using the developer's current code context.

---

## Milestone 8 — Safe Developer Tools

Deliverables:

- read file,
- search files,
- diagnostics,
- optional test/lint/build tools,
- explicit approval flow.

Success condition:

The assistant can perform controlled development tasks while the user remains in control.

---

## Milestone 9 — Local Memory

Deliverables:

- SQLite storage,
- learning preferences,
- recurring English mistakes,
- concept history,
- clear/reset controls.

Success condition:

The mentor can personalize future conversations using transparent local memory.

---

## 22. MVP Definition of Done

The MVP is complete when all of the following work reliably:

- VS Code extension installs and activates.
- Mentor panel opens inside VS Code.
- User can type questions.
- Extension communicates with local Node.js backend.
- Backend communicates with Ollama.
- Qwen3 8B answers questions.
- Current conversation context is preserved.
- Meaningful English mistakes are corrected.
- Coding answer is returned alongside the correction.
- Errors such as unavailable Ollama are handled gracefully.
- Setup instructions are documented.
- Project can be started from a clean machine using the README instructions, assuming required local software is installed.

Voice, codebase tools, and persistent memory are not required for MVP completion.

---

## 23. Testing Strategy

### Unit Tests

Test:

- request validation,
- response schema validation,
- configuration loading,
- prompt construction,
- fallback parsing,
- session handling.

### Integration Tests

Test:

```text
VS Code Extension
        ↓
Local Backend
        ↓
Ollama
        ↓
Qwen3
```

### UI Tests

Verify:

- panel opens,
- messages render correctly,
- loading state works,
- errors are visible,
- long responses remain readable.

### Voice Tests — Later

Test:

- microphone permission,
- recording,
- speech recognition,
- transcription accuracy,
- audio playback,
- interruption.

### Context Tests — Later

Test:

- current file extraction,
- selected text extraction,
- diagnostics retrieval,
- context size limits,
- secret-file exclusion.

---

## 24. Acceptance Criteria by Major Feature

| Feature | Acceptance Criteria |
|---|---|
| VS Code panel | Opens reliably and displays mentor conversation |
| Text chat | User can ask and receive responses |
| Local backend | Extension communicates over localhost |
| Ollama | Qwen3 responds through local inference |
| Context | Follow-up questions use previous messages |
| English coach | Meaningful errors are corrected concisely |
| Error handling | Service/model failures do not crash UI |
| Streaming | Architecture supports progressive response display |
| Voice input | Later version converts speech into usable text |
| Voice output | Later version plays mentor response |
| Code context | Later version includes selected/current code |
| Tools | Later version requires user approval for risky actions |
| Memory | Later version stores only intended local learning data |

---

## 25. Future Features

Potential future features include:

### Personalized Learning

- adaptive explanation difficulty,
- DSA practice mode,
- mock technical interviews,
- daily coding goals,
- English vocabulary suggestions based on coding conversations.

### Advanced Context

- semantic code search,
- repository indexing,
- RAG over project documentation,
- dependency analysis,
- architecture understanding.

### Agentic Development

- test-and-debug loops,
- build diagnostics,
- controlled code edits,
- patch previews,
- user-approved command execution.

### Communication Training

- pronunciation feedback,
- technical interview speaking practice,
- filler-word detection,
- explanation quality feedback,
- vocabulary recommendations.

### Personal Analytics

- concepts learned,
- recurring coding mistakes,
- recurring English mistakes,
- response latency,
- coding sessions and learning streaks.

These features should only be implemented after the core product proves useful.

---

## 26. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Local LLM latency | High | Use concise prompts, streaming, no-think/simple inference for suitable tasks, measure latency |
| Model gives incorrect technical advice | High | Ask for context, explain uncertainty, encourage verification, add tests/docs workflow |
| English correction becomes annoying | Medium | Use a correction threshold and keep feedback concise |
| WebView UI complexity | Medium | Keep MVP UI minimal |
| Voice pipeline latency | High | Add voice only after text pipeline works; benchmark STT/LLM/TTS separately |
| Large codebase exceeds context window | High | Add targeted retrieval/context selection later |
| Tool execution becomes unsafe | High | Read-only tools first and require user approval for risky actions |
| Model output format breaks | Medium | Schema validation and plain-text fallback |
| Hardware limitations | Medium | Keep model configurable and support smaller Ollama models later |
| Secret leakage through context | High | Exclude common secret files and minimize context by default |

---

## 27. Product Metrics

Initial metrics should measure usefulness and responsiveness rather than vanity metrics.

### MVP Metrics

- successful chat request rate,
- average time to first token,
- average total response time,
- response parsing success rate,
- backend uptime during session,
- number of user questions successfully answered.

### Learning Metrics — Later

- repeated English error categories,
- vocabulary learned,
- concepts practiced,
- user-reported usefulness,
- reduction in repeated mistakes.

Metrics should be collected locally by default and should not require uploading user data.

---

## 28. Configuration Requirements

The user should eventually be able to configure:

```text
AI Model
Backend Port
Response Length
English Correction: On/Off
Voice Input: On/Off
Voice Output: On/Off
Auto Context: On/Off
Tool Permissions
Memory: On/Off
```

For MVP, only essential configuration is required:

- Ollama model,
- backend URL/port.

---

## 29. Developer Experience Requirements

The project is intended to be built and maintained by a student developer, so generated or manually written code should remain understandable.

Requirements:

- TypeScript strict mode where practical.
- Small modules with clear responsibilities.
- No unnecessary frameworks in MVP.
- Clear naming.
- Environment-specific configuration separated from code.
- README setup instructions.
- Useful error messages.
- Reproducible local development commands.
- Git commits organized by milestone.

Example scripts:

```text
npm run dev
npm run build
npm run test
npm run lint
```

Exact tooling may be selected during implementation.

---

## 30. Repository / Git Requirements

The repository should use a clear commit structure such as:

```text
feat: create VS Code mentor panel
feat: add local chat backend
feat: connect Ollama Qwen3
feat: add structured English correction
feat: add streaming responses
feat: add speech-to-text
feat: add text-to-speech
feat: add VS Code code context
feat: add safe developer tools
feat: add local memory
```

The README should contain:

- project overview,
- architecture,
- prerequisites,
- installation,
- Ollama setup,
- development commands,
- extension launch instructions,
- troubleshooting,
- roadmap.

---

## 31. Initial Development Rules

To avoid unnecessary complexity, development should follow these rules:

### Rule 1 — Build vertically

Each milestone should result in a working feature rather than a large amount of unfinished infrastructure.

### Rule 2 — Local first

Do not add cloud APIs to the MVP.

### Rule 3 — Text before voice

Do not integrate speech recognition or TTS until the text mentor works reliably.

### Rule 4 — Context before agents

Do not build autonomous tools before the assistant can reliably use simple VS Code context.

### Rule 5 — User control

The AI may suggest actions, but later tool execution must be permission-based.

### Rule 6 — Understand generated code

AI coding tools may generate implementation, but every milestone should be reviewed and understood by the project owner.

### Rule 7 — Keep the MVP small

Avoid adding RAG, vector databases, multi-agent systems, web search, or autonomous coding before they solve a demonstrated product problem.

---

## 32. Initial Build Plan

The first implementation sequence is:

```text
STEP 1
Create VS Code extension project

        ↓

STEP 2
Build Mentor sidebar/chat UI

        ↓

STEP 3
Create Node.js local backend

        ↓

STEP 4
Connect backend → Ollama → Qwen3

        ↓

STEP 5
Return structured English + coding response

        ↓

STEP 6
Add streaming

        ↓

STEP 7
Add faster-whisper voice input

        ↓

STEP 8
Add Piper voice output

        ↓

STEP 9
Add VS Code code/selection/diagnostic context

        ↓

STEP 10
Add safe tools and local memory
```

---

## 33. First Build Scope for Coding Agent

When using a coding agent such as OpenCode or Muse Spark, the agent should be instructed to work milestone by milestone.

### First task

> Create a VS Code extension using TypeScript. Add a Mentor sidebar/panel with a simple chat interface. Include a message list, text input, send button, loading state, and clear conversation action. Use mocked responses only. Do not implement Ollama, Qwen, voice, Whisper, Piper, backend APIs, codebase analysis, tools, RAG, or memory yet. Keep the code modular and understandable. After implementation, explain the files created, how the extension works, and how to run/test it.

### Second task

> Create a local Node.js TypeScript backend with `/health` and `/api/chat`. Connect the VS Code extension to the backend. Continue using mocked AI responses. Do not add voice, tools, RAG, or memory.

### Third task

> Connect the backend to the local Ollama API using the configurable `qwen3:8b` model. Implement conversation context and graceful failure handling. Keep the existing extension UI and avoid unrelated changes.

### Fourth task

> Add structured mentor responses containing an English correction object and a coding answer. Validate the response and provide a plain-text fallback when parsing fails.

The same pattern should be followed for later milestones.

---

## 34. Definition of Product Success

The project should be considered successful when a developer can stay inside VS Code and naturally do the following:

```text
Think of a programming problem
        ↓
Ask the mentor
        ↓
Receive a useful English correction when needed
        ↓
Understand the technical explanation
        ↓
Ask follow-up questions
        ↓
Continue coding
```

The product should feel like a development companion rather than a separate chatbot window.

---

## 35. Long-Term Product Direction

The eventual product can evolve from:

```text
Chatbot inside VS Code
```

to:

```text
Voice-first coding mentor
          +
English communication coach
          +
Codebase-aware assistant
          +
Safe developer tools
          +
Local learning memory
```

The core principle remains unchanged:

> **Help the developer become better, not merely help the developer finish the current task.**

---

## 36. Document Change Log

### Version 1.0

- Defined product vision and problem statement.
- Defined MVP and out-of-scope features.
- Defined VS Code, backend, LLM, voice, context, tools, and memory requirements.
- Defined architecture and technology stack.
- Defined milestones and acceptance criteria.
- Defined security, privacy, performance, testing, and development rules.
- Defined the first prompts/tasks for AI-assisted implementation.

import express from 'express';
import {
  getHistoryLimit,
  getMentorProvider,
  getOllamaConfig,
  getPort
} from './config';
import { registerChatRoutes } from './routes/chat';
import { registerHealthRoutes } from './routes/health';
import { MentorService, MockMentorService } from './services/mentorService';
import { OllamaMentorService } from './services/ollamaMentorService';
import type { ApiErrorResponse } from './types';

/**
 * Local backend entry point (Milestone 3).
 *
 *   VS Code Extension → HTTP → this server → MentorService → Ollama/Qwen3
 *
 * The route layer only sees the MentorService interface. Set
 * MENTOR_PROVIDER=mock to fall back to the stub (useful for UI work
 * without Ollama); the default is the Ollama-backed mentor.
 */
function createMentorService(): MentorService {
  if (getMentorProvider() === 'mock') {
    // eslint-disable-next-line no-console
    console.log('Using MockMentorService (MENTOR_PROVIDER=mock).');
    return new MockMentorService();
  }
  const ollama = getOllamaConfig();
  const historyLimit = getHistoryLimit();
  // eslint-disable-next-line no-console
  console.log(
    `Using OllamaMentorService model="${ollama.model}" ` +
      `url="${ollama.baseUrl}" timeoutMs=${ollama.timeoutMs} ` +
      `historyLimit=${historyLimit}.`
  );
  return new OllamaMentorService(
    ollama.baseUrl,
    ollama.model,
    ollama.timeoutMs,
    historyLimit
  );
}

function createApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: '256kb' }));

  const mentorService = createMentorService();
  registerHealthRoutes(app);
  registerChatRoutes(app, mentorService);

  // Consistent JSON shape for unknown routes.
  app.use((_req: express.Request, res: express.Response): void => {
    const err: ApiErrorResponse = { error: 'Not found.' };
    res.status(404).json(err);
  });

  return app;
}

const app = createApp();
const port = getPort();
app.set('port', port);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`AI Coding Mentor server listening on http://localhost:${port}`);
});

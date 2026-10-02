import type { Express, Request, Response } from 'express';
import {
  MentorService,
  MentorServiceError
} from '../services/mentorService';
import type {
  ApiErrorResponse,
  ChatRequestBody,
  ChatSuccessResponse
} from '../types';

/**
 * POST /api/chat — mentor chat endpoint (Milestone 3: Ollama-backed).
 *
 * Contract (unchanged from Milestone 2):
 *   request  { "message": string, "conversationId"?: string }
 *   success  200 { "answer": string }
 *   failure  400 { "error": string } for invalid/empty message
 *            502/503/504 { "error": string } for model/backend failures
 *            500 { "error": string } for unexpected errors
 *
 * `conversationId` is optional and only scopes in-memory history;
 * clients that omit it share the default session.
 */
export function registerChatRoutes(
  app: Express,
  mentorService: MentorService
): void {
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const body = req.body as ChatRequestBody | undefined;
      const message = body?.message;

      if (typeof message !== 'string') {
        const err: ApiErrorResponse = {
          error: 'Invalid request body: "message" must be a string.'
        };
        res.status(400).json(err);
        return;
      }

      if (message.trim().length === 0) {
        const err: ApiErrorResponse = {
          error: 'Invalid request: "message" must not be empty.'
        };
        res.status(400).json(err);
        return;
      }

      const rawSession = body?.conversationId;
      const sessionId =
        typeof rawSession === 'string' && rawSession.trim().length > 0
          ? rawSession.trim()
          : undefined;

      // eslint-disable-next-line no-console
      console.log(
        `[chat] POST /api/chat received (messageLength=${message.length})`
      );

      const answer = await mentorService.getResponse(message, sessionId);
      const ok: ChatSuccessResponse = { answer };
      res.status(200).json(ok);
    } catch (error) {
      if (error instanceof MentorServiceError) {
        const err: ApiErrorResponse = { error: error.message };
        res.status(error.statusCode).json(err);
        return;
      }
      // eslint-disable-next-line no-console
      console.error('POST /api/chat failed:', error);
      const err: ApiErrorResponse = {
        error: 'Internal server error while generating a response.'
      };
      res.status(500).json(err);
    }
  });
}

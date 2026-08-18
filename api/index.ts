import type { Express, Request, Response } from 'express';
import { createNestApp } from '../src/bootstrap';

// Vercel keeps this module in memory across "warm" invocations of the same
// serverless function instance, so the Nest app is only bootstrapped once
// (no app.listen() here — Vercel owns the HTTP server, we just forward requests).
let cachedServer: Express | undefined;

async function getServer(): Promise<Express> {
  if (!cachedServer) {
    const app = await createNestApp();
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

export default async function handler(req: Request, res: Response) {
  const server = await getServer();
  server(req, res);
}

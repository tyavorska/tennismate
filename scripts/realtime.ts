/**
 * The messaging server. Route Handlers cannot hold a WebSocket open, so it runs as its own process.
 *
 *   npm run realtime
 */
import { createServer } from 'node:http';
import { serverEnv } from '@/server/config/env';
import { createRealtimeServer } from '@/server/realtime';

const httpServer = createServer((_request, response) => {
  response.writeHead(404).end();
});
createRealtimeServer(httpServer, { allowedOrigin: serverEnv.REALTIME_ALLOWED_ORIGIN });

httpServer.listen(serverEnv.REALTIME_PORT, () => {
  console.log(`Realtime server on port ${serverEnv.REALTIME_PORT}`);
});

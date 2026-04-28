import { buildTransactionVector } from './vectorizer.mjs';
import { calculateFraudScore } from './knn.mjs';

const socketPath = process.env.SOCKET_PATH;

const handleRequest = async (req) => {
  if (req.method === 'GET' && req.url.endsWith('/ready')) {
    return new Response('{"status":"Ready"}', {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST' && req.url.endsWith('/fraud-score')) {
    const payload = await req.json();
    const queryVec = buildTransactionVector(payload);
    const result = calculateFraudScore(queryVec);
    return new Response(result, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('', { status: 404 });
};

const serverOptions = socketPath
  ? { unix: socketPath, fetch: handleRequest }
  : { port: 9999, fetch: handleRequest };

Bun.serve(serverOptions);

if (socketPath) {
  const { chmodSync } = await import('node:fs');
  chmodSync(socketPath, 0o777);
}

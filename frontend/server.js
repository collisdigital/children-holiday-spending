import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

const distPath = path.join(__dirname, 'dist');

fastify.register(fastifyStatic, {
  root: distPath,
  prefix: '/',
  // This is important for SPA routing:
  wildcard: false 
});

// SPA fallback: for any route that isn't a static asset, serve index.html
fastify.setNotFoundHandler((req, reply) => {
  reply.sendFile('index.html');
});

const start = async () => {
  try {
    // Listen on port 8000 or PORT env var
    const port = process.env.PORT || 8000;
    await fastify.listen({ port: Number(port), host: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

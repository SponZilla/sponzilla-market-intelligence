import { buildApp } from './app';
import { config } from './config';

const app = buildApp();

const start = async () => {
  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`⚡ SponZilla API Server running at http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

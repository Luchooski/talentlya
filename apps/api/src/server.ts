import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function start() {
  await connectDB();
  await app.listen({ port: Number(env.PORT), host: '0.0.0.0' });
  console.log(`🚀 Servidor http://localhost:${env.PORT}`);
}
start();

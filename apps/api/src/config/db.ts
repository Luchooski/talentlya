import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function connectDB(maxRetries = 5, delayMs = 2000): Promise<void> {
  const safeUri = env.MONGODB_URI.startsWith('mongodb+srv://')
    ? 'mongodb+srv://<hidden>@cluster/...'
    : env.MONGODB_URI.replace(/\/\/.*@/, '//<hidden>@');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`🟢 MongoDB conectado (intent ${attempt}/${maxRetries}) → ${safeUri}`);
      // Cierres ordenados
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('🟡 Conexión MongoDB cerrada (SIGINT)');
        process.exit(0);
      });
      process.on('SIGTERM', async () => {
        await mongoose.connection.close();
        console.log('🟡 Conexión MongoDB cerrada (SIGTERM)');
        process.exit(0);
      });
      return;
    } catch (err: any) {
      console.error(
        `🔴 Fallo conectando a MongoDB (intent ${attempt}/${maxRetries}): ${err?.message ?? err}`,
      );
      if (attempt < maxRetries) {
        console.log(`⏳ Reintentando en ${delayMs}ms...`);
        await sleep(delayMs);
      } else {
        console.error('❌ No se pudo conectar a MongoDB tras múltiples intentos.');
        process.exit(1);
      }
    }
  }
}

import { ConfigService } from '@nestjs/config';
import { createNestApp } from './bootstrap';

async function bootstrap() {
  const app = await createNestApp();
  const port = app.get(ConfigService).get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`Server running on port ${port} (HTTP + WebSocket)`);
}

bootstrap();

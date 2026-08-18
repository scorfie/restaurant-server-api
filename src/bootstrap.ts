import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const SWAGGER_UI_VERSION = '5.17.14';
const SWAGGER_CDN_BASE = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

export async function createNestApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(morgan(configService.get('NODE_ENV') === 'production' ? 'combined' : 'dev'));

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  setupSwagger(app);

  return app;
}

function setupSwagger(app: INestApplication) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Restaurant API')
    .setDescription('REST API for managing restaurant branches')
    .setVersion('2.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Serve the Swagger UI's own JS/CSS from a CDN instead of node_modules/swagger-ui-dist.
  // On Vercel (and other bundling serverless platforms), those static asset files aren't
  // traced/included in the function bundle since they're never `require()`d — only read
  // from disk at request time — so they 404 in production even though they work locally.
  SwaggerModule.setup('api-docs', app, document, {
    customCssUrl: `${SWAGGER_CDN_BASE}/swagger-ui.css`,
    customJs: [`${SWAGGER_CDN_BASE}/swagger-ui-bundle.js`, `${SWAGGER_CDN_BASE}/swagger-ui-standalone-preset.js`],
  });
}

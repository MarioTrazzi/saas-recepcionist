import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(helmet())
  app.enableCors({
    origin: [process.env.FRONTEND_URL || '*', 'https://frontend-production-cf0e.up.railway.app'],
    credentials: true,
  })
  app.setGlobalPrefix('api')

  // Health check — bypasses global prefix, usado pelo Railway
  app.getHttpAdapter().get('/health', (_req: any, res: any) => res.json({ ok: true }))
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  const config = new DocumentBuilder()
    .setTitle('AI Receptionist API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))

  await app.listen(process.env.PORT || 3001)
  console.log(`Backend running on port ${process.env.PORT || 3001}`)
}
bootstrap()

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestDynamicTemplatesModule,
  TemplateEngineEnum,
  TemplateLanguageEnum,
} from '@ackplus/nest-dynamic-templates';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'example.sqlite',
      autoLoadEntities: true, // picks up the library's entities
      synchronize: true,
    }),
    NestDynamicTemplatesModule.forRoot({
      isGlobal: true,
      engines: {
        template: [TemplateEngineEnum.NUNJUCKS],
        language: [TemplateLanguageEnum.HTML, TemplateLanguageEnum.MJML],
      },
      // Custom filters/globals are available in every engine.
      filters: {
        upper: (value: string) => String(value).toUpperCase(),
      },
      globals: {
        brandName: 'Acme Inc.',
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

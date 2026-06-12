import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  TemplateService,
  TemplateEngineEnum,
  TemplateLanguageEnum,
} from '@ackplus/nest-dynamic-templates';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly templates: TemplateService) {}

  /** Seed a demo template once at startup (idempotent). */
  async onModuleInit(): Promise<void> {
    const existing = await this.templates.findTemplate('welcome-email', 'system');
    if (existing) return;

    await this.templates.createTemplate({
      name: 'welcome-email',
      displayName: 'Welcome email',
      scope: 'system',
      locale: 'en',
      type: 'email',
      engine: TemplateEngineEnum.NUNJUCKS,
      language: TemplateLanguageEnum.HTML,
      subject: 'Welcome to {{ brandName }}, {{ firstName }}!',
      content: '<h1>Hello {{ firstName | upper }}</h1><p>Thanks for joining {{ brandName }}.</p>',
    });
  }

  /** Render the seeded welcome template for a given name. */
  renderWelcome(firstName: string) {
    return this.templates.render({
      name: 'welcome-email',
      scope: 'system',
      context: { firstName },
    });
  }
}

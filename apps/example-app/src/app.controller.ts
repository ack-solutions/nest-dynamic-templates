import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  CreateTemplateDto,
  RenderTemplateDto,
  TemplateService,
} from '@ackplus/nest-dynamic-templates';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly templates: TemplateService,
  ) {}

  @Get()
  info() {
    return {
      message: 'nest-dynamic-templates example app',
      try: [
        'GET /demo?name=Ada      → renders the welcome template',
        'GET /demo/error         → triggers a rich render error (HTTP 422)',
        'POST /render { name, context } → render any stored template',
      ],
    };
  }

  /** Render the seeded welcome template. */
  @Get('demo')
  demo(@Query('name') name = 'Ada') {
    return this.appService.renderWelcome(name);
  }

  /**
   * Intentionally omit `firstName` to showcase the diagnostic error. The thrown
   * TemplateRenderError maps to HTTP 422 with the missing variable, source line
   * and the context keys you passed.
   */
  @Get('demo/error')
  demoError() {
    return this.templates.render({ name: 'welcome-email', scope: 'system', context: {} });
  }

  /** Render any stored template by name. */
  @Post('render')
  render(@Body() dto: RenderTemplateDto) {
    return this.templates.render(dto);
  }

  /** List the system templates. */
  @Get('templates')
  list() {
    return this.templates.getTemplates({ scope: 'system' });
  }

  /**
   * Create a system template. The request body (CreateTemplateDto) documents
   * every field — open this in Swagger (/api) to see what each column means.
   */
  @Post('templates')
  create(@Body() dto: CreateTemplateDto) {
    return this.templates.createTemplate(dto);
  }
}

# Getting started

## Install

```bash
npm install @ackplus/nest-dynamic-templates
npm install @nestjs/typeorm typeorm reflect-metadata
```

Install **only the engines you enable**:

| You enable | Install |
| --- | --- |
| `njk` (Nunjucks, default) | `npm install nunjucks` |
| `hbs` (Handlebars) | `npm install handlebars` |
| `ejs` | `npm install ejs` |
| `pug` | `npm install pug` |
| `mjml` (email) | `npm install mjml` |
| `md` (Markdown) | `npm install marked` |
| `html`, `txt` | built in — nothing to install |

## 1. Register the module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NestDynamicTemplatesModule,
  TemplateEngineEnum,
  TemplateLanguageEnum,
} from '@ackplus/nest-dynamic-templates';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      // ...your db config
      autoLoadEntities: true, // picks up the library's entities
    }),
    NestDynamicTemplatesModule.forRoot({
      isGlobal: true,
      engines: {
        template: [TemplateEngineEnum.NUNJUCKS],
        language: [TemplateLanguageEnum.HTML, TemplateLanguageEnum.MJML],
      },
    }),
  ],
})
export class AppModule {}
```

::: tip Entities
With `autoLoadEntities: true` the library's tables are registered automatically. For explicit control (e.g. migrations) import `NestDynamicTemplatesEntities` and spread it into your TypeORM `entities` array.
:::

## 2. Create a template

```typescript
import { Injectable } from '@nestjs/common';
import {
  TemplateService,
  TemplateEngineEnum,
  TemplateLanguageEnum,
} from '@ackplus/nest-dynamic-templates';

@Injectable()
export class TemplatesSeeder {
  constructor(private readonly templates: TemplateService) {}

  seed() {
    return this.templates.createTemplate({
      name: 'welcome-email',
      displayName: 'Welcome email',
      scope: 'system',
      locale: 'en',
      subject: 'Welcome, {{ firstName }}!',
      content: '<h1>Hello {{ firstName }}</h1><p>Thanks for joining.</p>',
      engine: TemplateEngineEnum.NUNJUCKS,
      language: TemplateLanguageEnum.HTML,
      type: 'email',
    });
  }
}
```

## 3. Render it

```typescript
const { subject, content } = await this.templates.render({
  name: 'welcome-email',
  scope: 'system',
  locale: 'en',
  context: { firstName: 'Ada' },
});
// subject -> "Welcome, Ada!"
// content -> "<h1>Hello Ada</h1><p>Thanks for joining.</p>"
```

## Render a raw string

Skip the database entirely with `renderContent()`:

```typescript
const html = await this.templates.renderContent({
  content: 'Hi {{ name }}',
  engine: TemplateEngineEnum.NUNJUCKS,
  language: TemplateLanguageEnum.HTML,
  context: { name: 'World' },
});
```

Next: **[Configuration](/guide/configuration)** and the headline feature, **[Error handling](/guide/errors)**.

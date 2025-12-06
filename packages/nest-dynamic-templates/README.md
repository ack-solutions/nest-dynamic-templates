# @ackplus/nest-dynamic-templates

A powerful and flexible dynamic template rendering library for NestJS applications. Support for multiple template engines (Nunjucks, Handlebars, EJS, Pug) and content languages (HTML, MJML, Markdown, Text), with built-in database storage and layout management.

## ✨ Features

- 🔌 **Multiple Engines** - Support for Nunjucks, Handlebars, EJS, and Pug
- 📝 **Multi-Format** - Render HTML, MJML, Markdown, or Plain Text
- 🗄️ **Database Storage** - Store templates in your database (TypeORM support)
- 🎨 **Layout Support** - Create reusable layouts for your templates
- 🌍 **Scope & Locale** - Manage templates by scope (system/user/tenant) and locale (en/es/etc.)
- 🚀 **Dynamic Rendering** - Render templates with dynamic context at runtime

## 📦 Installation

```bash
npm install @ackplus/nest-dynamic-templates
# or
pnpm add @ackplus/nest-dynamic-templates
# or
yarn add @ackplus/nest-dynamic-templates
```

### Peer Dependencies

You must install the necessary peer dependencies depending on which engines and database you use:

```bash
# Core dependencies
npm install @nestjs/common @nestjs/core @nestjs/typeorm typeorm reflect-metadata

# Template Engines (install at least one)
npm install nunjucks @types/nunjucks
# OR
npm install handlebars
# OR
npm install ejs @types/ejs
# OR
npm install pug @types/pug

# Language Support (optional)
npm install mjml @types/mjml      # For MJML support
npm install htmlparser2           # For HTML processing
```

## 🚀 Quick Start

### 1. Import Module

Import `NestDynamicTemplatesModule` into your root `AppModule`. You must configure it with `TypeORM`.

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestDynamicTemplatesModule, TemplateEngineEnum, TemplateLanguageEnum } from '@ackplus/nest-dynamic-templates';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // ... your database config
    }),
    NestDynamicTemplatesModule.forRoot({
      engines: {
        template: [TemplateEngineEnum.NUNJUCKS], // Enable specific engines
        language: [TemplateLanguageEnum.HTML, TemplateLanguageEnum.MJML]
      },
      isGlobal: true, // Optional: make module global
    }),
  ],
})
export class AppModule {}
```

### 2. Create a Template

You can create templates programmatically using the `TemplateService`.

```typescript
import { Injectable } from '@nestjs/common';
import { TemplateService, TemplateEngineEnum, TemplateLanguageEnum } from '@ackplus/nest-dynamic-templates';

@Injectable()
export class MyService {
  constructor(private readonly templateService: TemplateService) {}

  async createWelcomeTemplate() {
    await this.templateService.createTemplate({
      name: 'welcome-email',
      scope: 'system', // 'system' or custom scope
      locale: 'en',
      subject: 'Welcome, {{ name }}!',
      content: '<h1>Hello {{ name }}</h1><p>Welcome to our platform.</p>',
      engine: TemplateEngineEnum.NUNJUCKS,
      language: TemplateLanguageEnum.HTML,
      type: 'email',
    });
  }
}
```

### 3. Render a Template

Render a stored template by name.

```typescript
async renderEmail(userName: string) {
  const result = await this.templateService.render({
    name: 'welcome-email',
    scope: 'system',
    locale: 'en',
    context: {
      name: userName,
    },
  });

  console.log(result.subject); // "Welcome, John!"
  console.log(result.content); // "<h1>Hello John</h1><p>Welcome to our platform.</p>"
}
```

## 📚 API Reference

### TemplateService

The main service for managing and rendering templates.

#### `render(options: RenderTemplateDto)`
Renders a template stored in the database.

```typescript
const output = await templateService.render({
  name: 'my-template',
  scope: 'system',
  locale: 'en',
  context: { foo: 'bar' },
});
```

#### `renderContent(options: RenderContentTemplateDto)`
Renders raw content string directly without fetching from the database.

```typescript
const html = await templateService.renderContent({
  content: 'Hello {{ name }}',
  engine: TemplateEngineEnum.NUNJUCKS,
  context: { name: 'World' },
});
```

#### `createTemplate(data: CreateTemplateDto)`
Creates a new system template.

#### `updateTemplate(id: string, updates: Partial<CreateTemplateDto>)`
Updates an existing template. If you try to update a `system` template without permission, it may create a scoped override instead.

### TemplateLayoutService

Manage reusable layouts (e.g., email wrappers with header/footer).

#### `createLayout(data: CreateTemplateLayoutDto)`
Create a new layout.

```typescript
await layoutService.createLayout({
  name: 'main-layout',
  content: '<html><body>{{ content }}</body></html>', // {{ content }} is the placeholder
  engine: TemplateEngineEnum.NUNJUCKS,
});
```

## ⚙️ Configuration Options

When importing the module, you can configure the enabled engines:

```typescript
NestDynamicTemplatesModule.forRoot({
  engines: {
    // Template Logic Engines
    template: [
      TemplateEngineEnum.NUNJUCKS, 
      TemplateEngineEnum.HANDLEBARS, 
      TemplateEngineEnum.EJS, 
      TemplateEngineEnum.PUG
    ],
    // Output Language Processors
    language: [
      TemplateLanguageEnum.HTML, 
      TemplateLanguageEnum.MJML, 
      TemplateLanguageEnum.TEXT, 
      TemplateLanguageEnum.MARKDOWN
    ]
  }
})
```

## 📄 License

This project is licensed under the MIT License.

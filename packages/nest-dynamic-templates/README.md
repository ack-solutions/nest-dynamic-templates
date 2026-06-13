# @ackplus/nest-dynamic-templates

[![npm version](https://img.shields.io/npm/v/@ackplus/nest-dynamic-templates.svg)](https://www.npmjs.com/package/@ackplus/nest-dynamic-templates)
[![npm downloads](https://img.shields.io/npm/dm/@ackplus/nest-dynamic-templates.svg)](https://www.npmjs.com/package/@ackplus/nest-dynamic-templates)
[![license](https://img.shields.io/npm/l/@ackplus/nest-dynamic-templates.svg)](https://github.com/ack-solutions/nest-dynamic-templates/blob/main/packages/nest-dynamic-templates/LICENSE)
[![docs](https://img.shields.io/badge/docs-online-10b981.svg)](https://ack-solutions.github.io/nest-dynamic-templates/)

> Database-backed, multi-engine template rendering for NestJS — with **error messages that actually tell you what went wrong**.

Store templates in your database, render them at runtime with the engine of your choice (Nunjucks, Handlebars, EJS, Pug), and post-process the output as HTML, MJML, Markdown or plain text. Built for transactional email, notifications, PDFs and any per-tenant/per-locale content.

📖 **[Documentation](https://ack-solutions.github.io/nest-dynamic-templates/)** · 🐙 **[GitHub](https://github.com/ack-solutions/nest-dynamic-templates)** · 🔀 **[Migration (v2)](./MIGRATION.md)** · 📝 **[Changelog](./CHANGELOG.md)**

---

## Why this library

- 🧩 **Two-stage pipeline** — a *template engine* interpolates your variables, then a *language processor* turns the result into final markup. Mix and match (e.g. Nunjucks → MJML).
- 🗄️ **Database storage** — templates and layouts live in your DB (TypeORM), versioned and editable at runtime.
- 🌍 **Scope & locale resolution** — ship `system` defaults and let a `user`/`tenant`/`organization` override them, per locale, with automatic fallback.
- 🪶 **Lightweight & lazy** — only the engines you enable are loaded, so you only install the peers you actually use.
- 🛑 **Diagnostic errors** — when a render fails you get the **missing variable**, the **source line**, the **context keys you passed**, and an **actionable hint** — not a generic 500.

## Install

```bash
npm install @ackplus/nest-dynamic-templates
# peer deps you always need:
npm install @nestjs/typeorm typeorm reflect-metadata
```

Then install **only the engines you enable**:

| You enable | Install |
| --- | --- |
| `njk` (Nunjucks, default) | `npm install nunjucks` |
| `hbs` (Handlebars) | `npm install handlebars` |
| `ejs` | `npm install ejs` |
| `pug` | `npm install pug` |
| `mjml` (email) | `npm install mjml` |
| `md` (Markdown) | `npm install marked` |
| `html`, `txt` | nothing — built in |

> **Enabled by default** (if you omit `engines`): template `['njk']`, language `['html', 'mjml', 'txt']`. Install the peers for whatever you enable.

## Quick start

### 1. Register the module

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
      autoLoadEntities: true, // picks up the library's entities automatically
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

> Prefer explicit entities (e.g. for migrations)? Import `NestDynamicTemplatesEntities` and spread it into your TypeORM `entities` array.

### 2. Create a template

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

### 3. Render it

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

Need to render a raw string without touching the DB? Use `renderContent()`:

```typescript
const html = await this.templates.renderContent({
  content: 'Hi {{ name }}',
  engine: TemplateEngineEnum.NUNJUCKS,
  language: TemplateLanguageEnum.HTML,
  context: { name: 'World' },
});
```

## Error handling

This is the headline feature. Every render failure throws a typed error with a structured `details` payload and the original error attached as `cause`. Missing-variable failures name the variable and list the context you actually passed:

```typescript
import { TemplateRenderError, TemplateErrorCode, isTemplateError } from '@ackplus/nest-dynamic-templates';

try {
  await templates.render({ name: 'welcome-email', context: { email: 'a@b.com' } });
} catch (err) {
  if (isTemplateError(err)) {
    console.error(err.code);             // 'TEMPLATE_RENDER_FAILED'
    console.error(err.details.missingVariable); // 'firstName'
    console.error(err.details.contextKeys);     // ['email']
    console.error(err.details.location);        // { line: 1, column: 16 }
    console.error(err.details.snippet);         // '<h1>Hello {{ firstName }}</h1>...'
    console.error(err.details.hint);            // 'Pass "firstName" in the render context. ...'
  }
}
```

The thrown message reads:

```
Failed to render template "welcome-email" [njk → html, scope=system, locale=en]: variable "firstName" is undefined.
```

Each error also **extends the matching NestJS HTTP exception**, so Nest's exception filter maps the right status automatically and your existing `catch (NotFoundException)` keeps working:

| Error | HTTP | `code` |
| --- | --- | --- |
| `TemplateRenderError` | 422 | `TEMPLATE_RENDER_FAILED` |
| `TemplateNotFoundError` | 404 | `TEMPLATE_NOT_FOUND` |
| `TemplateInputError` | 400 | `TEMPLATE_INVALID_INPUT` |
| `TemplateForbiddenError` | 403 | `TEMPLATE_FORBIDDEN` |
| `TemplateConflictError` | 409 | `TEMPLATE_CONFLICT` |
| `TemplateEngineUnavailableError` | 500 | `TEMPLATE_ENGINE_UNAVAILABLE` |

## Configuration

```typescript
NestDynamicTemplatesModule.forRoot({
  isGlobal: true,

  // Only these engines are loaded. Default: { template: ['njk'], language: ['html','mjml','txt'] }
  engines: {
    template: [TemplateEngineEnum.NUNJUCKS, TemplateEngineEnum.HANDLEBARS],
    language: [TemplateLanguageEnum.HTML, TemplateLanguageEnum.MJML, TemplateLanguageEnum.MARKDOWN],
  },

  // Custom filters/helpers — available in EVERY template engine.
  filters: {
    formatDate: (d: Date, fmt: string) => /* ... */ '',
    formatCurrency: (n: number, ccy: string) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy }).format(n),
  },

  // Global values injected into every render (strings, numbers, objects or functions).
  globals: {
    brandName: 'Acme',
    year: () => new Date().getFullYear(),
  },

  // Raw options forwarded to the underlying engine libraries.
  engineOptions: {
    template: { njk: { autoescape: true, trimBlocks: true } },
    language: { mjml: { validationLevel: 'soft' } },
  },
});
```

### Async configuration

```typescript
NestDynamicTemplatesModule.forRootAsync({
  isGlobal: true,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    engines: { template: ['njk'], language: ['html', 'mjml'] },
    globals: { appUrl: config.get('APP_URL') },
  }),
});
```

## Scope & locale resolution

`render()` resolves a template by trying, in order:

1. requested **scope** + requested **locale**
2. requested **scope** + `en`
3. **system** scope + requested locale
4. **system** scope + `en`

This lets you ship `system` defaults and override them per tenant/user and per language. Only **active** templates (`isActive: true`) are resolved. Example:

```typescript
// Falls back to the system template if this user has no override.
await templates.render({ name: 'welcome-email', scope: 'user', scopeId: userId, locale: 'fr' });
```

## Template fields

A template is a database row. The key fields (full reference with use cases in the [docs](https://ack-solutions.github.io/nest-dynamic-templates/reference/template-fields)):

| Field | Required | Default | Purpose |
| --- | --- | --- | --- |
| `name` | ✅ | — | Stable id you render by, e.g. `welcome-email`. |
| `scope` | — | `system` | **Who owns this version** — `system` (shared default) or a custom owner kind like `tenant`/`user`. |
| `scopeId` | — | `null` | **Which owner** inside the scope (e.g. the tenant id). Empty for `system`. |
| `locale` | — | `en` | Language variant; missing locales fall back to `en`. |
| `engine` | — | `njk` | Template engine: `njk`, `hbs`, `ejs`, `pug`. |
| `language` | ✅ | — | Output processor: `html`, `mjml`, `md`, `txt`. |
| `subject` | — | `null` | Subject line (emails); rendered with the engine. |
| `content` | ✅ | — | The template body. |
| `templateLayoutName` | — | `null` | Layout to wrap this content in. |
| `displayName` | — | — | Human-friendly label for admin UIs. |
| `type` | — | `null` | Free category for grouping, e.g. `email`/`sms`. |
| `previewContext` | — | `null` | Sample data for previews (not used at render time). |
| `isActive` | — | `true` | Set `false` to disable without deleting. |

**`scope` vs `scopeId`** is the part to understand: `scope` is the *kind* of owner (`system`, or your own `tenant`/`user`/…), and `scopeId` is the *exact* owner (the tenant id). Together with `name` + `locale` they uniquely identify a template, and a render falls back from a specific override to the `system` default — so you only store overrides where they differ.

## Layouts

Layouts are reusable wrappers (e.g. an email shell). The child content is injected where the layout references `{{ content }}`:

```typescript
await layouts.createTemplateLayout({
  name: 'email-shell',
  displayName: 'Email shell',
  engine: TemplateEngineEnum.NUNJUCKS,
  language: TemplateLanguageEnum.HTML,
  content: '<html><body><header>{{ brandName }}</header>{{ content }}</body></html>',
});

// Attach it to a template:
await templates.createTemplate({
  name: 'welcome-email',
  templateLayoutName: 'email-shell',
  /* ...rest... */
});
```

## Services

- **`TemplateService`** — `render`, `renderContent`, `createTemplate`, `updateTemplate`, `overwriteSystemTemplate`, `deleteTemplate`, `getTemplates`, `findTemplate`, `getTemplateById`.
- **`TemplateLayoutService`** — the same surface for layouts.
- **`TemplateConfigService`** — read-only accessor over the resolved config.
- **`TemplateEngineRegistryService`** — access the engine instances directly.

## Migrating from v1

v2 is a focused redesign. See **[MIGRATION.md](./MIGRATION.md)** for the (short) list of breaking changes and how to update — most apps only need to rename `enginesOptions` to the new flat `filters` / `globals` / `engineOptions`.

## License

MIT © AckPlus

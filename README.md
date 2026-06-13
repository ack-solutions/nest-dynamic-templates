# @ackplus/nest-dynamic-templates

<p align="center">
  <a href="https://nestjs.com/" target="_blank"><img src="https://nestjs.com/img/logo-small.svg" width="110" alt="NestJS logo" /></a>
</p>

<p align="center">Database-backed, multi-engine template rendering for NestJS — with error messages that actually tell you what went wrong.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@ackplus/nest-dynamic-templates"><img src="https://img.shields.io/npm/v/@ackplus/nest-dynamic-templates.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@ackplus/nest-dynamic-templates"><img src="https://img.shields.io/npm/dm/@ackplus/nest-dynamic-templates.svg" alt="npm downloads" /></a>
  <a href="https://www.npmjs.com/package/@ackplus/nest-dynamic-templates"><img src="https://img.shields.io/npm/l/@ackplus/nest-dynamic-templates.svg" alt="license" /></a>
  <a href="https://ack-solutions.github.io/nest-dynamic-templates/"><img src="https://img.shields.io/badge/docs-online-10b981.svg" alt="documentation" /></a>
</p>

<p align="center">
  <strong><a href="https://ack-solutions.github.io/nest-dynamic-templates/">📖 Documentation</a></strong> ·
  <a href="https://www.npmjs.com/package/@ackplus/nest-dynamic-templates">📦 npm</a> ·
  <a href="./packages/nest-dynamic-templates/MIGRATION.md">🔀 Migration (v2)</a> ·
  <a href="./packages/nest-dynamic-templates/CHANGELOG.md">📝 Changelog</a>
</p>

---

Store templates in your **database** and render them at runtime with the engine of your choice (Nunjucks, Handlebars, EJS, Pug), then post-process the output as HTML, MJML, Markdown or plain text. Built for transactional email, notifications, PDFs, and any per-tenant / per-locale content.

## Features

- 🧩 **Two-stage pipeline** — a template engine interpolates variables, then a language processor produces the final markup (e.g. Nunjucks → MJML).
- 🗄️ **Database storage** — templates and layouts live in your DB via TypeORM, editable at runtime.
- 🌍 **Scope & locale resolution** — ship `system` defaults and override them per tenant/user and per language, with automatic fallback.
- 🪶 **Lightweight & lazy** — only the engines you enable are loaded, so you only install the peers you use.
- 🛑 **Diagnostic errors** — a failed render reports the missing variable, the source line, the context keys you passed, and a fix hint.

## Install

```bash
npm install @ackplus/nest-dynamic-templates @nestjs/typeorm typeorm reflect-metadata
# then install only the engines you enable, e.g.:
npm install nunjucks mjml
```

## Quick start

**1. Register the module:**

```typescript
import { NestDynamicTemplatesModule, TemplateEngineEnum, TemplateLanguageEnum } from '@ackplus/nest-dynamic-templates';

@Module({
  imports: [
    TypeOrmModule.forRoot({ /* ...db, */ autoLoadEntities: true }),
    NestDynamicTemplatesModule.forRoot({
      isGlobal: true,
      // Defaults if omitted: template ['njk'], language ['html', 'mjml', 'txt'].
      engines: { template: [TemplateEngineEnum.NUNJUCKS], language: [TemplateLanguageEnum.HTML, TemplateLanguageEnum.MJML] },
    }),
  ],
})
export class AppModule {}
```

**2. Create a template, then render it** (inject `TemplateService`):

```typescript
await templateService.createTemplate({
  name: 'welcome-email',
  displayName: 'Welcome email',
  engine: TemplateEngineEnum.NUNJUCKS,
  language: TemplateLanguageEnum.HTML,
  subject: 'Welcome, {{ firstName }}!',
  content: '<h1>Hello {{ firstName }}</h1>',
});

const { subject, content } = await templateService.render({
  name: 'welcome-email',
  context: { firstName: 'Ada' },
});
```

See the **[full guide](https://ack-solutions.github.io/nest-dynamic-templates/guide/getting-started)** for configuration, scopes & locales, layouts, and the error model.

## Documentation

- 📖 **[Documentation site](https://ack-solutions.github.io/nest-dynamic-templates/)** — guides, configuration, recipes
- 🧱 **[Template fields](https://ack-solutions.github.io/nest-dynamic-templates/reference/template-fields)** — every column explained, incl. `scope`/`scopeId`
- 🛑 **[Error handling](https://ack-solutions.github.io/nest-dynamic-templates/guide/errors)** — diagnostic render errors
- 📦 **[Package README](./packages/nest-dynamic-templates/README.md)** — the npm-facing docs
- 🔀 **[Migration to v2](./packages/nest-dynamic-templates/MIGRATION.md)** · 📝 **[Changelog](./packages/nest-dynamic-templates/CHANGELOG.md)**

## Repository layout

This is a pnpm monorepo:

```
nest-dynamic-templates/
├── packages/
│   └── nest-dynamic-templates/   # 📦 the published library
├── apps/
│   └── example-app/              # 🧪 runnable NestJS example (render + diagnostic errors)
└── docs/                         # 📖 VitePress documentation site (GitHub Pages)
```

## Local development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run the library test suite
pnpm -C packages/nest-dynamic-templates exec jest

# Run the example app (after building the library)
pnpm -C apps/example-app start        # http://localhost:3000 (Swagger at /api)

# Run the docs site locally
cd docs && npm install && npm run docs:dev
```

## Contributing

Issues and pull requests are welcome — please open them on the [issue tracker](https://github.com/ack-solutions/nest-dynamic-templates/issues). For development setup, see **Local development** above; please make sure `pnpm build` and the test suite pass before opening a PR.

## License

[MIT](./packages/nest-dynamic-templates/LICENSE) © AckPlus

## Links

- 📦 [npm package](https://www.npmjs.com/package/@ackplus/nest-dynamic-templates)
- 📖 [Documentation](https://ack-solutions.github.io/nest-dynamic-templates/)
- 🐙 [GitHub repository](https://github.com/ack-solutions/nest-dynamic-templates)
- 🐞 [Issue tracker](https://github.com/ack-solutions/nest-dynamic-templates/issues)

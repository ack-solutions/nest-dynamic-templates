# Engines & languages

Rendering happens in two stages: a **template engine** interpolates variables, then a **language processor** produces the final markup. Enable the ones you need in [`engines`](/guide/configuration#engines).

## Template engines

| Enum | Value | Package | Notes |
| --- | --- | --- | --- |
| `TemplateEngineEnum.NUNJUCKS` | `njk` | `nunjucks` | Default. Throws on undefined variables (great with the diagnostic errors). |
| `TemplateEngineEnum.HANDLEBARS` | `hbs` | `handlebars` | Filters are registered as helpers. |
| `TemplateEngineEnum.EJS` | `ejs` | `ejs` | Filters/globals exposed as locals. |
| `TemplateEngineEnum.PUG` | `pug` | `pug` | Filters/globals exposed as locals. |

## Language processors

| Enum | Value | Package | Notes |
| --- | --- | --- | --- |
| `TemplateLanguageEnum.HTML` | `html` | — | Pass-through. |
| `TemplateLanguageEnum.MJML` | `mjml` | `mjml` | Compiles MJML email to HTML; validation errors are surfaced with line numbers. |
| `TemplateLanguageEnum.MARKDOWN` | `md` | `marked` | Renders Markdown to HTML. |
| `TemplateLanguageEnum.TEXT` | `txt` | — | Pass-through (SMS, plain text). |

## Filters and globals work everywhere

A single `filters` / `globals` config is shared across all template engines:

```typescript
NestDynamicTemplatesModule.forRoot({
  engines: { template: ['njk', 'hbs', 'ejs'], language: ['html'] },
  filters: { shout: (s: string) => s.toUpperCase() },
  globals: { brand: 'Acme' },
});
```

```nunjucks
{# Nunjucks: filter syntax #}
{{ name | shout }} — {{ brand }}
```
```handlebars
{{! Handlebars: helper syntax }}
{{shout name}} — {{brand}}
```
```ejs
<%# EJS: callable locals %>
<%= shout(name) %> — <%= brand %>
```

## Lazy loading

Engine packages are imported lazily on first use, and only enabled engines are instantiated. If a template references an engine that isn't enabled — or whose package isn't installed — you get a clear [`TemplateEngineUnavailableError`](/reference/error-codes) telling you exactly what to enable or install.

## Custom engines

The base classes `TemplateEngine` and `LanguageEngine` are exported if you want to implement your own processor. Each defines `render(content, data)` and `validate(content)` plus static `engineName` / `displayName` / `peerPackage` metadata.

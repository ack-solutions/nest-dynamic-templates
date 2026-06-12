# Layouts

Layouts are reusable wrappers — an email shell, a branded header/footer — shared across many templates. The child template's rendered output is injected wherever the layout references <code v-pre>{{ content }}</code>.

## Create a layout

```typescript
import { TemplateLayoutService } from '@ackplus/nest-dynamic-templates';

await layouts.createTemplateLayout({
  name: 'email-shell',
  displayName: 'Email shell',
  engine: TemplateEngineEnum.NUNJUCKS,
  language: TemplateLanguageEnum.HTML,
  content: `<!doctype html>
<html>
  <body>
    <header>{{ brandName }}</header>
    <main>{{ content }}</main>
    <footer>© {{ year }}</footer>
  </body>
</html>`,
});
```

## Attach it to a template

Set `templateLayoutName` on the template:

```typescript
await templates.createTemplate({
  name: 'welcome-email',
  templateLayoutName: 'email-shell',
  content: '<p>Hello {{ firstName }}</p>',
  engine: TemplateEngineEnum.NUNJUCKS,
  language: TemplateLanguageEnum.HTML,
  /* ...rest... */
});
```

When you render `welcome-email`, the content is interpolated first, then injected into the layout as `content`:

```typescript
await templates.render({
  name: 'welcome-email',
  context: { firstName: 'Ada', brandName: 'Acme', year: 2026 },
});
```

::: tip
The layout has its own `engine` and `language`, so the language processing (e.g. MJML → HTML) happens on the **layout**. Layouts resolve by scope and locale exactly like templates, so you can localize the shell too.
:::

## Ad-hoc layouts

`renderContent()` accepts a `templateLayoutId` to wrap a raw string in a stored layout without a stored template.

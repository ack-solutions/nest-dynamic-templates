# Configuration

All options are passed to `NestDynamicTemplatesModule.forRoot()` (or `forRootAsync()`). Every field is optional.

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

## `engines`

The enabled list **gates which engines are instantiated** — this is what keeps peer dependencies optional. List every engine you use and install its package. Rendering with a disabled engine throws [`TemplateEngineUnavailableError`](/reference/error-codes).

```typescript
engines: {
  template: ['njk'],              // TemplateEngineEnum values: njk, hbs, ejs, pug
  language: ['html', 'mjml', 'txt'], // TemplateLanguageEnum values: html, mjml, md, txt
}
```

::: warning The list is replaced, not merged
Passing `template: ['hbs']` gives you exactly `['hbs']` — it does **not** keep the default `njk`.
:::

## `filters`

Functions usable in any engine. In Nunjucks they're filters (<code v-pre>{{ amount | formatCurrency('USD') }}</code>); in Handlebars they're helpers (<code v-pre>{{formatCurrency amount 'USD'}}</code>); in EJS/Pug they're callable locals.

## `globals`

Values available without being passed in `context` on every render. Functions are supported (Nunjucks globals, callable locals elsewhere).

## `engineOptions`

Raw options forwarded straight to the underlying library, keyed by engine:

- `template.njk` → Nunjucks [`ConfigureOptions`](https://mozilla.github.io/nunjucks/api.html#configure)
- `template.hbs` → Handlebars compile options
- `template.ejs` → EJS options
- `template.pug` → Pug options
- `language.mjml` → `mjml2html` options (e.g. `validationLevel`)

## Async configuration

Use `forRootAsync()` when options depend on other providers (e.g. `ConfigService`):

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

`useClass` and `useExisting` factories are also supported via `NestDynamicTemplatesModuleOptionsFactory`.

## Migrating from v1 config

The v1 `enginesOptions` block is replaced by the flat `filters` / `globals` / `engineOptions` fields. The old shape still works with a deprecation warning — see the [migration guide](/migration).

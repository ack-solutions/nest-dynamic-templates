# Migrating to v2

v2 is a focused redesign around clearer configuration, diagnostic errors and a lighter install. Most apps only need step 1.

## 1. Flatten `enginesOptions`

The nested block becomes top-level fields (the old shape still works with a deprecation warning):

```diff
 NestDynamicTemplatesModule.forRoot({
   engines: { template: ['njk'], language: ['html', 'mjml'] },
-  enginesOptions: {
-    filters: { formatDate },
-    globalValues: { brandName: 'Acme' },
-    template: { njk: { autoescape: true } },
-  },
+  filters: { formatDate },
+  globals: { brandName: 'Acme' },        // renamed from globalValues
+  engineOptions: { template: { njk: { autoescape: true } } },
 });
```

## 2. `engines` now gates loading

In v1 the list was ignored — every engine loaded. In v2 only enabled engines are instantiated, so list every engine you use and install its peer. Rendering with a disabled engine throws `TemplateEngineUnavailableError`. The list is also **replaced**, not merged: `template: ['hbs']` yields exactly `['hbs']`.

## 3. Errors are restructured

| Removed (v1) | Use instead (v2) |
| --- | --- |
| `TemplateEngineError`, `TemplateLanguageError`, `TemplateLayoutError`, `TemplateContentError` | `TemplateRenderError` (rich `details`, **422**) |
| `TemplateValidationError` | `TemplateInputError` (400) |

- Render failures are now **422** (were 500).
- Use `isTemplateError(err)` and `err.code` / `err.details`; the original error is on `err.cause`.
- Errors still extend their matching Nest exception, so `instanceof NotFoundException` etc. keep working.

## 4. `TemplateConfigService` is injectable

It was a global static; now inject it and use instance methods. The static `setOptions`/`reset`/`hasConfig`/`get` are gone.

## 5. `render()` no longer accepts inline content

Use `renderContent()` for raw strings. The `renderEngine()`/`renderLanguage()` service helpers were removed.

## 6. Behavior tweaks

- `render()` returns `subject: string | null` (was `''`).
- HTML is a pass-through (no more `"Invalid HTML content"`).
- Markdown actually renders now (optional `marked` peer).
- Only `isActive: true` templates are resolved.

## 7. Dependencies

- **Removed required peers:** `@faker-js/faker`, `htmlparser2`.
- **New optional peer:** `marked` (only if you enable `md`).
- No database schema changes.

The full changelog lives in the package [CHANGELOG](https://github.com/ack-solutions/nest-dynamic-templates/blob/main/packages/nest-dynamic-templates/CHANGELOG.md).

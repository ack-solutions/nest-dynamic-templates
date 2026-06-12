# Migrating to v2

v2 is a focused redesign around three goals: **clearer configuration**, **diagnostic errors**, and a **lighter install**. Most apps only need the config rename in step 1.

## 1. Configuration: flatten `enginesOptions`

The nested `enginesOptions` block is replaced by top-level fields. The old shape still works (with a one-time deprecation warning), but you should migrate:

```diff
 NestDynamicTemplatesModule.forRoot({
   engines: { template: ['njk'], language: ['html', 'mjml'] },
-  enginesOptions: {
-    filters: { formatDate },
-    globalValues: { brandName: 'Acme' },
-    template: { njk: { autoescape: true } },
-    language: { mjml: { validationLevel: 'soft' } },
-  },
+  filters: { formatDate },
+  globals: { brandName: 'Acme' },          // renamed from globalValues
+  engineOptions: {
+    template: { njk: { autoescape: true } },
+    language: { mjml: { validationLevel: 'soft' } },
+  },
 });
```

## 2. The `engines` list now gates loading

In v1 the `engines` list was ignored — every engine was loaded regardless. In v2 **only enabled engines are instantiated**, which is what makes the peer dependencies truly optional.

- List every engine you use under `engines.template` / `engines.language`.
- Install only those engines' peer packages.
- Rendering with a disabled engine throws `TemplateEngineUnavailableError` with a hint.

Defaults are unchanged: `{ template: ['njk'], language: ['html', 'mjml', 'txt'] }`.

> Note: the engine list is now **replaced**, not merged. In v1 (deepmerge) passing `template: ['hbs']` produced `['njk', 'hbs']`; in v2 you get exactly `['hbs']`.

## 3. Errors are restructured

The granular v1 error classes are gone, replaced by a smaller, richer set:

| Removed (v1) | Use instead (v2) |
| --- | --- |
| `TemplateEngineError`, `TemplateLanguageError`, `TemplateLayoutError`, `TemplateContentError` | `TemplateRenderError` (rich `details`, HTTP **422**) |
| `TemplateValidationError` | `TemplateInputError` (HTTP 400) |
| raw `NotFoundException` | `TemplateNotFoundError` (still `instanceof NotFoundException`) |

Key changes:

- Render failures are now **HTTP 422** (were 500) — they're input/data errors, not server faults.
- Each error carries `error.code` (a `TemplateErrorCode`) and `error.details` (variable, location, snippet, context keys, hint). The original error is on `error.cause`.
- Use the `isTemplateError(err)` guard, or switch on `err.code`. Each error still extends its matching NestJS HTTP exception.

```diff
- } catch (err) {
-   if (err instanceof TemplateEngineError) { /* ... */ }
+ } catch (err) {
+   if (isTemplateError(err)) {
+     console.error(err.code, err.details.missingVariable, err.details.contextKeys);
+   }
 }
```

## 4. `TemplateConfigService` is now injectable

It was a global static in v1; it's a normal injectable service in v2 (fixes `forRootAsync` timing). The static methods (`setOptions`, `reset`, `hasConfig`, `get`) are removed. Inject it and call instance methods:

```diff
- TemplateConfigService.getOptions();
+ constructor(private readonly config: TemplateConfigService) {}
+ this.config.getOptions();
```

## 5. `render()` no longer accepts inline content

`RenderTemplateDto`'s `content` / `language` fields (which never actually worked in `render()`) are removed. To render a raw string, use `renderContent()`:

```diff
- await templates.render({ content: 'Hi {{ name }}', language: 'html', context });
+ await templates.renderContent({ content: 'Hi {{ name }}', engine: 'njk', language: 'html', context });
```

The low-level `renderEngine()` / `renderLanguage()` helpers were also removed from the services — use `renderContent()`.

## 6. Output and behavior tweaks

- `render()` returns `subject: string | null` (was `''`) when a template has no subject.
- The **HTML** processor is now a pass-through. v1 ran a strict validation that could reject valid output with `"Invalid HTML content"`; that's gone.
- **Markdown** now actually renders (via the optional `marked` peer). It was a no-op in v1.
- Only **active** templates (`isActive: true`) are resolved by `render()`.

## 7. Dependencies

- **Removed required peers:** `@faker-js/faker`, `htmlparser2`. Remove them from your install if you only added them for this library.
- **New optional peer:** `marked` — install it only if you enable the `md` language.
- No database schema changes — your existing tables are compatible.

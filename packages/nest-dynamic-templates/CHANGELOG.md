# Changelog

## 2.0.0

A focused redesign around clearer configuration, diagnostic errors and a lighter install. See [MIGRATION.md](./MIGRATION.md) for upgrade steps.

### Added
- **Diagnostic render errors.** Failures now throw `TemplateRenderError` carrying a structured `details` payload: the missing variable, the source `location` (line/column), a `snippet` of the offending line, the `contextKeys` you actually passed, and an actionable `hint`. The original error is preserved on `cause`.
- **Stable error codes** via `TemplateErrorCode` and an `isTemplateError()` guard. Every error extends its matching NestJS HTTP exception (404/422/400/403/409/500).
- **Flat configuration**: top-level `filters`, `globals` and `engineOptions`.
- **Custom filters/globals now work across all engines** (Nunjucks, Handlebars, EJS, Pug), not just Nunjucks.
- **Real Markdown rendering** via the optional `marked` peer.
- VitePress documentation site (GitHub Pages).

### Changed
- The `engines` list now **gates which engines are loaded** — only enabled engines are instantiated, making peer dependencies genuinely optional. The list is replaced, not merged with defaults.
- `TemplateConfigService` is now an injectable instance service (was a global static); this fixes `forRootAsync` timing.
- Render failures are **HTTP 422** (were 500).
- `render()` returns `subject: string | null` when there is no subject (was `''`).
- The HTML processor is a pass-through (the old strict validation that rejected valid output is removed).
- Engines load lazily; nothing is required until first use.

### Fixed
- MJML validation errors are now readable (were serialized as `[object Object]`).
- A missing layout now throws `TemplateNotFoundError` (404) instead of being miscategorized as a generic layout error.
- Removed double-wrapped error messages.
- The default HTML render path no longer fails with `"Invalid HTML content"`.

### Removed
- Required peer dependencies `@faker-js/faker` and `htmlparser2`; internal `yargs` and `deepmerge`.
- Error classes `TemplateEngineError`, `TemplateLanguageError`, `TemplateLayoutError`, `TemplateContentError`, `TemplateValidationError` (superseded by `TemplateRenderError` + `TemplateInputError`).
- Inline `content`/`language` fields on `RenderTemplateDto` (use `renderContent()`), and the `renderEngine()`/`renderLanguage()` service helpers.

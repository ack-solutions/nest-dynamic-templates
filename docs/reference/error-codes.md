# Error codes

Every error this library throws carries a stable `code` (a `TemplateErrorCode`), extends a NestJS HTTP exception, and — for render failures — a structured `details` payload. Use the `isTemplateError(err)` guard to narrow.

| `code` | Class | HTTP | When |
| --- | --- | --- | --- |
| `TEMPLATE_RENDER_FAILED` | `TemplateRenderError` | 422 | A template/layout failed to render (bad syntax, missing variable, language error). Carries the rich `details`. |
| `TEMPLATE_NOT_FOUND` | `TemplateNotFoundError` | 404 | The template/layout was not found in any scope or locale. |
| `TEMPLATE_INVALID_INPUT` | `TemplateInputError` | 400 | Invalid call input (e.g. missing `name`/`content`). |
| `TEMPLATE_FORBIDDEN` | `TemplateForbiddenError` | 403 | Operation not permitted (e.g. mutating a system template). |
| `TEMPLATE_CONFLICT` | `TemplateConflictError` | 409 | A template with the same identity already exists. |
| `TEMPLATE_ENGINE_UNAVAILABLE` | `TemplateEngineUnavailableError` | 500 | The engine is not enabled, or its peer package isn't installed. |

## `details` payload (render errors)

```typescript
interface TemplateErrorDetails {
  code: TemplateErrorCode;
  message: string;
  stage?: 'subject' | 'template-engine' | 'language-engine' | 'layout';
  engine?: string;
  language?: string;
  templateName?: string;
  scope?: string;
  scopeId?: string;
  locale?: string;
  missingVariable?: string;
  contextKeys?: string[];
  location?: { line: number; column?: number };
  snippet?: string;
  hint?: string;
}
```

## Narrowing

```typescript
import { isTemplateError, TemplateErrorCode } from '@ackplus/nest-dynamic-templates';

catch (err) {
  if (isTemplateError(err) && err.code === TemplateErrorCode.RENDER_FAILED) {
    logger.warn('render failed', err.details);
  }
  throw err;
}
```

See the [error handling guide](/guide/errors) for full examples and the JSON response shape.

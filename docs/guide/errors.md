# Error handling

The reason this library exists. When a render fails you get a typed error with a structured `details` payload — the missing variable, the source location, the context you passed, and how to fix it.

## The shape of a render error

```typescript
import { TemplateRenderError, isTemplateError } from '@ackplus/nest-dynamic-templates';

try {
  await templates.render({ name: 'welcome-email', context: { email: 'a@b.com' } });
} catch (err) {
  if (isTemplateError(err)) {
    err.code;                    // 'TEMPLATE_RENDER_FAILED'
    err.getStatus();             // 422
    err.details.missingVariable; // 'firstName'
    err.details.contextKeys;     // ['email']  ← what you actually passed
    err.details.location;        // { line: 1, column: 16 }
    err.details.snippet;         // '<h1>Hello {{ firstName }}</h1>'
    err.details.stage;           // 'template-engine'
    err.details.engine;          // 'njk'
    err.details.hint;            // 'Pass "firstName" in the render context. ...'
    err.cause;                   // the original engine error
  }
}
```

The message reads:

```
Failed to render template "welcome-email" [njk → html, scope=system, locale=en]: variable "firstName" is undefined.
```

### `details` fields

| Field | Description |
| --- | --- |
| `code` | Stable [`TemplateErrorCode`](/reference/error-codes). |
| `stage` | `subject` · `template-engine` · `language-engine` · `layout`. |
| `engine` / `language` | The processors in use. |
| `templateName`, `scope`, `scopeId`, `locale` | Which template was being rendered. |
| `missingVariable` | The undefined variable, when detectable. |
| `contextKeys` | The keys present in your render context. |
| `location` | `{ line, column }` in the template source. |
| `snippet` | The offending source line. |
| `hint` | A concrete next step. |

## Errors map to HTTP statuses

Each error extends its matching NestJS exception, so Nest's exception filter sets the status automatically and existing `catch` blocks keep working.

| Error | HTTP | `code` | Extends |
| --- | --- | --- | --- |
| `TemplateRenderError` | 422 | `TEMPLATE_RENDER_FAILED` | `UnprocessableEntityException` |
| `TemplateNotFoundError` | 404 | `TEMPLATE_NOT_FOUND` | `NotFoundException` |
| `TemplateInputError` | 400 | `TEMPLATE_INVALID_INPUT` | `BadRequestException` |
| `TemplateForbiddenError` | 403 | `TEMPLATE_FORBIDDEN` | `ForbiddenException` |
| `TemplateConflictError` | 409 | `TEMPLATE_CONFLICT` | `ConflictException` |
| `TemplateEngineUnavailableError` | 500 | `TEMPLATE_ENGINE_UNAVAILABLE` | `InternalServerErrorException` |

## Handling them

### Switch on `code`

```typescript
import { isTemplateError, TemplateErrorCode } from '@ackplus/nest-dynamic-templates';

catch (err) {
  if (!isTemplateError(err)) throw err;
  switch (err.code) {
    case TemplateErrorCode.NOT_FOUND:
      return fallbackTemplate();
    case TemplateErrorCode.RENDER_FAILED:
      logger.error({ ...err.details }); // structured logging
      throw err;
    default:
      throw err;
  }
}
```

### Let NestJS handle the response

Because the errors are HTTP exceptions, you can simply let them bubble out of a controller — the client gets a clean JSON body:

```json
{
  "statusCode": 422,
  "error": "TemplateRenderError",
  "code": "TEMPLATE_RENDER_FAILED",
  "message": "Failed to render template \"welcome-email\" [njk → html, scope=system, locale=en]: variable \"firstName\" is undefined.",
  "stage": "template-engine",
  "missingVariable": "firstName",
  "contextKeys": ["email"],
  "location": { "line": 1, "column": 16 },
  "snippet": "<h1>Hello {{ firstName }}</h1>",
  "hint": "Pass \"firstName\" in the render context. The render context has: [email]. To make it optional, guard it in the template, e.g. {{ firstName or \"\" }}."
}
```

::: tip Want missing variables to render empty instead of throwing?
Nunjucks throws on undefined by default (`throwOnUndefined: true`). To make variables optional, either guard them in the template (<code v-pre>{{ firstName or "" }}</code>) or pass `engineOptions.template.njk = { throwOnUndefined: false }`.
:::

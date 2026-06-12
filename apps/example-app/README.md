# Example app — @ackplus/nest-dynamic-templates

A minimal NestJS app that uses the library end-to-end: it seeds a template on
startup, renders it over HTTP, and demonstrates the diagnostic render error.

## Run it

```bash
# from the repo root: build the library first (the app consumes its dist)
pnpm -C packages/nest-dynamic-templates build

# then start the example
pnpm -C apps/example-app start
```

The app listens on `http://localhost:3000` (Swagger UI at `/api`) and uses a
local `better-sqlite3` database (`example.sqlite`).

## Endpoints

| Method & path | What it does |
| --- | --- |
| `GET /` | Lists the available demo endpoints. |
| `GET /demo?name=Ada` | Renders the seeded `welcome-email` template. |
| `GET /demo/error` | Omits a required variable to show the **diagnostic 422 error**. |
| `POST /render` | Renders any stored template — body: `{ "name": "...", "context": { ... } }`. |

### Try the error

```bash
curl -s http://localhost:3000/demo/error | jq
```

```json
{
  "statusCode": 422,
  "error": "TemplateRenderError",
  "code": "TEMPLATE_RENDER_FAILED",
  "message": "Failed to render template \"welcome-email\" [njk → html, scope=system, locale=en]: variable \"firstName\" is undefined.",
  "missingVariable": "firstName",
  "contextKeys": [],
  "hint": "Pass \"firstName\" in the render context. ..."
}
```

## Where to look

- [`src/app.module.ts`](src/app.module.ts) — registering `NestDynamicTemplatesModule` with engines, filters and globals.
- [`src/app.service.ts`](src/app.service.ts) — seeding and rendering a template.
- [`src/app.controller.ts`](src/app.controller.ts) — the endpoints above.
- [`test/app.e2e-spec.ts`](test/app.e2e-spec.ts) — an end-to-end test of render + error.

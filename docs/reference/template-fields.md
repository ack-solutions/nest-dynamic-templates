# Template fields

Every template (and layout) is a row in the database. This page explains each
field — what it's for and when to set it — so you can model your content with
confidence. If you only read one section, make it **[scope & scopeId](#scope-scopeid-the-important-one)**.

## At a glance

| Field | Type | Required | Default | What it's for |
| --- | --- | --- | --- | --- |
| `name` | string | ✅ | — | Stable identifier you render by, e.g. `welcome-email`. |
| `scope` | string | — | `system` | **Who owns this version** — `system` (shared default) or a custom owner like `tenant`/`user`. |
| `scopeId` | string | — | `null` | **Which owner** inside that scope, e.g. the tenant id. Empty for `system`. |
| `locale` | string | — | `en` | Language variant, e.g. `en`, `fr`, `es`. |
| `engine` | enum | — | `njk` | Template engine that interpolates variables (`njk`, `hbs`, `ejs`, `pug`). |
| `language` | enum | — | `null` | Output processor (`html`, `mjml`, `md`, `txt`). |
| `subject` | string | — | `null` | Subject line (emails). Rendered with the engine too. |
| `content` | text | ✅ | — | The template body. |
| `templateLayoutName` | string | — | `null` | Name of a layout to wrap this content in. |
| `displayName` | string | ✅* | — | Human-friendly label for admin UIs. |
| `description` | text | — | `null` | Notes about what the template is for. |
| `type` | string | — | `null` | Free category, e.g. `email`/`sms`/`push`/`pdf`. For grouping/filtering. |
| `previewContext` | json | — | `null` | Sample data to preview the template without real data. |
| `isActive` | boolean | — | `true` | Set `false` to disable without deleting. |
| `id` | uuid | auto | — | Primary key. |
| `createdAt` / `updatedAt` | date | auto | — | Timestamps. |

<small>\* `displayName` is optional on the entity but required by `CreateTemplateDto`.</small>

::: tip The identity of a template
`name` + `scope` + `scopeId` + `locale` together are **unique**. That's what lets
you store the *same* `welcome-email` as a system default, a tenant override, and
a French translation — all at once.
:::

---

## Identity fields

These four fields decide **which** template a render resolves to.

### `name`

The stable key you render by. Lowercase letters, numbers, `-` and `_` only
(e.g. `welcome-email`, `order_receipt`). It stays the same across scopes and
locales — that's the whole point.

```ts
await templates.render({ name: 'welcome-email', /* ... */ });
```

### `scope` & `scopeId` — the important one

This is the multi-tenant override mechanism, and it's simpler than it looks:

- **`scope` = who owns this version of the template.**
  - `system` → the shared default your app ships. Everyone gets it unless they have an override.
  - anything else (`tenant`, `user`, `organization`, …) → a custom override owned by a specific entity. The string is yours to choose.
- **`scopeId` = which specific owner**, inside that scope.
  - For `system`, `scopeId` is empty (`null`).
  - For `scope: 'tenant'`, `scopeId` is the tenant's id.

Think of it as **"`scope` is the *kind* of owner, `scopeId` is the *exact* owner."**

#### Use cases

| Goal | scope | scopeId |
| --- | --- | --- |
| One default for everybody | `system` | — |
| Acme Corp gets its own welcome email | `tenant` | `acme` |
| Per-user email signature | `user` | the user's id |
| Region-wide override for EU | `region` | `eu` |

#### How it resolves

When you render, the library looks for the **most specific** match and falls
back to the system default — so you only store overrides where they differ:

```ts
// Acme gets its custom version; everyone else falls back to the system default.
await templates.render({
  name: 'welcome-email',
  scope: 'tenant',
  scopeId: 'acme',
  context: { firstName: 'Ada' },
});
```

If no `tenant/acme` template exists, it automatically uses the `system` one. You
never have to copy the default into every tenant. See
[Scopes & locales](/guide/scopes-and-locales) for the full resolution order.

::: warning
You don't create `scope: 'tenant'` rows directly — `createTemplate()` only makes
`system` templates. Create an override from a system template with
`overwriteSystemTemplate()` (or `updateTemplate()` with a non-system scope). This
keeps the shared default safe.
:::

### `locale`

The language variant — `en`, `fr`, `es`, … Create the same `name` once per
locale. A request for a missing locale falls back to `en`.

```ts
await templates.createTemplate({ name: 'welcome-email', locale: 'en', content: 'Hello {{ name }}', /* ... */ });
await templates.createTemplate({ name: 'welcome-email', locale: 'fr', content: 'Bonjour {{ name }}', /* ... */ });
```

---

## Content fields

These decide **what** gets produced.

### `engine`

The template engine that interpolates your variables — `njk` (Nunjucks,
default), `hbs`, `ejs` or `pug`. It must be [enabled in config](/guide/configuration#engines).

### `language`

The output processor that runs **after** interpolation:

- `html` — pass-through (already HTML).
- `mjml` — compile MJML email markup to bulletproof HTML.
- `md` — render Markdown to HTML.
- `txt` — plain text (SMS, notifications).

Leave it empty to skip post-processing entirely. See [Engines & languages](/guide/engines).

### `content`

The template body itself — the thing that gets rendered. Uses your chosen
engine's syntax:

```html
<h1>Hello {{ firstName }}</h1>
<p>Your order {{ orderId }} has shipped.</p>
```

### `subject`

An optional subject line (for emails). It's rendered with the **same engine**, so
it can use variables too:

```
Welcome, {{ firstName }}!
```

The render result returns it separately: `{ subject, content }`.

### `templateLayoutName`

The `name` of a [layout](/guide/layouts) to wrap this content in (e.g. a shared
email shell). Leave empty for standalone templates.

---

## Metadata fields

These don't affect rendering — they help you organize and manage templates,
typically in an admin UI.

### `displayName`

A human-friendly label, e.g. `"Welcome email"`, shown in dashboards instead of
the machine `name`.

### `description`

Free-text notes about what the template is for and who uses it.

### `type`

A free category string for grouping and filtering. The `TemplateTypeEnum`
convenience enum suggests `email`, `sms`, `push`, `pdf`, but any string works.
Used by `getTemplates({ type })`.

### `previewContext`

Sample data (JSON) you can use to **preview** the template without real data —
handy for an admin "preview" button. It's not applied automatically during
`render()`; it's there for your tooling.

```ts
previewContext: { firstName: 'Ada', orderId: '1234' }
```

### `isActive`

`true` by default. Set it to `false` to **disable** a template without deleting
it — inactive templates are skipped during resolution, so rendering falls back to
the system default (or throws not-found).

---

## System fields

`id` (uuid primary key) and `createdAt` / `updatedAt` are managed for you.

---

## Layouts use the same fields

[`NestDynamicTemplateLayout`](/reference/services) has the **same fields**, with
one difference: layouts have no `subject`. Everything above — scope, scopeId,
locale, engine, language, isActive — works identically, so you can have
per-tenant and per-locale layouts too.

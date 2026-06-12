# Scopes & locales

A template is identified by `name` + `scope` + `scopeId` + `locale`. This lets you ship **system** defaults and let a tenant, organization or user override them — per language.

> New to `scope` / `scopeId`? The [Template fields](/reference/template-fields#scope-scopeid-the-important-one) page explains every column with use cases.

## Resolution order

`render()` resolves a template by trying, in order:

1. requested **scope** + requested **locale**
2. requested **scope** + `en`
3. **system** scope + requested locale
4. **system** scope + `en`

The first match wins. Only **active** templates (`isActive: true`) are considered.

```typescript
// Uses the user's override if present, otherwise the system template;
// prefers French, falling back to English.
await templates.render({
  name: 'welcome-email',
  scope: 'user',
  scopeId: userId,
  locale: 'fr',
});
```

## Creating overrides

System templates are created directly. Scoped overrides are created from a system template:

```typescript
// 1. The shared default.
const system = await templates.createTemplate({
  name: 'welcome-email', scope: 'system', locale: 'en', /* ... */
});

// 2. A tenant-specific override (does not touch the system template).
await templates.overwriteSystemTemplate(system.id, {
  scope: 'tenant',
  scopeId: 'tenant-123',
  content: '<h1>Welcome to Tenant 123, {{ firstName }}</h1>',
});
```

`updateTemplate(id, updates)` follows the same rule: updating a **system** template without `canUpdateSystemTemplate: true` will instead create/update a scoped override when you pass a non-system `scope`, protecting the shared default.

## Locales

Provide localized variants by creating the same `name` with different `locale` values. A request for an unknown locale falls back to `en`:

```typescript
await templates.createTemplate({ name: 'welcome-email', locale: 'en', content: 'Hello {{ name }}', /* ... */ });
await templates.createTemplate({ name: 'welcome-email', locale: 'es', content: '¡Hola {{ name }}!', /* ... */ });

await templates.render({ name: 'welcome-email', locale: 'de', context: { name: 'Ada' } });
// -> falls back to 'en': "Hello Ada"
```

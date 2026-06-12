# Services

All services are injectable and exported from the module.

## `TemplateService`

| Method | Description |
| --- | --- |
| `render(dto)` | Resolve a stored template by name (scope/locale fallback) and render it. Returns `{ subject: string \| null, content: string }`. |
| `renderContent(dto)` | Render a raw content string without the database. Returns `string`. |
| `createTemplate(data)` | Create a **system** template. |
| `updateTemplate(id, updates, canUpdateSystem?)` | Update a template; creates a scoped override for system templates unless permitted. |
| `overwriteSystemTemplate(id, updates)` | Create/update a scoped override from a system template. |
| `deleteTemplate(id, canDeleteSystem?)` | Delete a template (system templates require the flag). |
| `getTemplates(filter?)` | List templates, scoped entries overriding system ones. |
| `findTemplate(name, scope?, scopeId?, locale?)` | Resolve a single active template with fallback. |
| `getTemplateById(id)` | Fetch by primary key. |

## `TemplateLayoutService`

The same surface as `TemplateService`, for layouts: `render`, `renderContent`, `createTemplateLayout`, `updateTemplateLayout`, `overwriteSystemTemplateLayout`, `deleteTemplateLayout`, `getTemplateLayouts`, `findTemplateLayout`, `getTemplateLayoutById`.

## `TemplateConfigService`

Read-only accessor over the resolved configuration. Inject it to inspect what's enabled:

```typescript
constructor(private readonly config: TemplateConfigService) {}

this.config.getEnabledTemplateEngines();   // ['njk', ...]
this.config.isLanguageEngineEnabled('mjml');
this.config.getFilters();
this.config.getGlobals();
```

## `TemplateEngineRegistryService`

Low-level access to engine instances: `getTemplateEngine(engine)`, `getLanguageEngine(language)`, `hasTemplateEngine`, `getSupportedTemplateFormats()`, etc.

## DTOs & types

`RenderTemplateDto`, `RenderContentTemplateDto`, `CreateTemplateDto`, `CreateTemplateLayoutDto`, `TemplateFilterDto`, and the enums `TemplateEngineEnum`, `TemplateLanguageEnum`, `TemplateTypeEnum` are all exported. The entity classes `NestDynamicTemplate` and `NestDynamicTemplateLayout` (and the `NestDynamicTemplatesEntities` array) are exported for TypeORM registration and migrations.

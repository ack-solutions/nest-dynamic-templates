# Recipes

## Transactional email with MJML + a layout

```typescript
// Shell (MJML) — note {{ content }} where the body goes.
await layouts.createTemplateLayout({
  name: 'mjml-shell',
  displayName: 'MJML shell',
  engine: TemplateEngineEnum.NUNJUCKS,
  language: TemplateLanguageEnum.MJML,
  content: `<mjml><mj-body>
    <mj-section><mj-column>
      <mj-text font-size="20px">{{ brandName }}</mj-text>
    </mj-column></mj-section>
    {{ content }}
  </mj-body></mjml>`,
});

// Body template — rendered, then injected into the shell, then MJML -> HTML.
await templates.createTemplate({
  name: 'welcome-email',
  displayName: 'Welcome',
  templateLayoutName: 'mjml-shell',
  engine: TemplateEngineEnum.NUNJUCKS,
  language: TemplateLanguageEnum.MJML,
  subject: 'Welcome, {{ firstName }}!',
  content: `<mj-section><mj-column>
    <mj-text>Hello {{ firstName }}, thanks for joining {{ brandName }}.</mj-text>
  </mj-column></mj-section>`,
});

const { subject, content } = await templates.render({
  name: 'welcome-email',
  context: { firstName: 'Ada', brandName: 'Acme' },
});
// `content` is bulletproof email HTML — hand it to your mailer.
```

## Per-tenant branding override

```typescript
const system = await templates.findTemplate('welcome-email', 'system');

await templates.overwriteSystemTemplate(system.id, {
  scope: 'tenant',
  scopeId: tenant.id,
  content: `<mj-section><mj-column>
    <mj-text>Welcome to {{ tenantName }}, {{ firstName }}!</mj-text>
  </mj-column></mj-section>`,
});

// Rendering for this tenant now uses the override; everyone else gets the system default.
await templates.render({ name: 'welcome-email', scope: 'tenant', scopeId: tenant.id, context });
```

## Reusable filters (dates, money)

```typescript
NestDynamicTemplatesModule.forRoot({
  engines: { template: ['njk'], language: ['html'] },
  filters: {
    formatDate: (d: Date, fmt = 'YYYY-MM-DD') => /* your formatter */ '',
    formatCurrency: (n: number, ccy = 'USD') =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: ccy }).format(n),
  },
});
```

```nunjucks
Order {{ orderId }} placed {{ date | formatDate('MMMM D, YYYY') }} — total {{ amount | formatCurrency('USD') }}
```

## Surfacing render errors to an API client

Because render errors are HTTP exceptions, a controller can simply let them bubble:

```typescript
@Post('preview')
async preview(@Body() dto: PreviewDto) {
  // Throws TemplateRenderError (422) with full details if a variable is missing —
  // the client receives a precise JSON body, no extra handling needed.
  return this.templates.render(dto);
}
```

See **[Error handling](/guide/errors)** for the response shape.

# What & why

`@ackplus/nest-dynamic-templates` renders templates that live in your **database**, so non-developers can edit content at runtime and you can vary it per tenant, user and locale — without redeploying.

## The two-stage pipeline

Every render runs in two stages:

```
context ─▶ [ template engine ] ─▶ [ language processor ] ─▶ output
            njk / hbs / ejs / pug    html / mjml / md / txt
```

1. **Template engine** — interpolates your variables and runs template logic (<code v-pre>{{ user.name }}</code>, loops, conditionals, filters).
2. **Language processor** — turns the interpolated string into final markup (compile MJML to HTML, render Markdown, or pass HTML/text through).

You pick the pair per template, so an email might be **Nunjucks → MJML** while an SMS is **Handlebars → Text**.

## When to use it

- Transactional **email** (with MJML for bulletproof HTML).
- **Notifications** (SMS, push) with per-locale copy.
- **PDF**/document bodies.
- Any content a tenant or admin should be able to override.

## What makes it different

Most template libraries leave you staring at `attempted to output null or undefined value` with no idea which variable or template caused it. This library’s **[diagnostic errors](/guide/errors)** name the missing variable, point to the source line, and list the context you actually passed — which is the whole reason it exists.

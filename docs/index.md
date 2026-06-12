---
layout: home

hero:
  name: nest-dynamic-templates
  text: Dynamic templates for NestJS
  tagline: Database-backed, multi-engine rendering — with error messages that actually tell you what went wrong.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Error handling
      link: /guide/errors
    - theme: alt
      text: View on GitHub
      link: https://github.com/ack-solutions/nest-dynamic-templates

features:
  - icon: 🧩
    title: Two-stage pipeline
    details: A template engine (Nunjucks, Handlebars, EJS, Pug) interpolates your variables, then a language processor (HTML, MJML, Markdown, Text) produces the final markup.
  - icon: 🗄️
    title: Stored in your database
    details: Templates and layouts live in your DB via TypeORM — editable at runtime, versioned, and scoped per tenant, user or locale.
  - icon: 🌍
    title: Scope & locale resolution
    details: Ship system defaults and override them per tenant/user and per language, with automatic fallback to system / en.
  - icon: 🪶
    title: Lightweight & lazy
    details: Only the engines you enable are loaded, so you only install the peer packages you actually use.
  - icon: 🛑
    title: Diagnostic errors
    details: A failed render tells you the missing variable, the source line, the context keys you passed, and how to fix it — not a generic 500.
  - icon: ⚙️
    title: First-class NestJS
    details: forRoot / forRootAsync, dependency injection, and errors that map to the right HTTP status automatically.
---

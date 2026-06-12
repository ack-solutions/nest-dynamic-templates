import { RenderStage, TemplateRenderError } from './template.errors';

/** Identity of the render that failed, used to build a precise message. */
export interface RenderContextMeta {
    stage: RenderStage;
    engine?: string;
    language?: string;
    templateName?: string;
    scope?: string;
    scopeId?: string;
    locale?: string;
}

/**
 * Turn a raw engine/library error into a rich {@link TemplateRenderError}.
 *
 * Best-effort extraction (never throws): it pulls the source location, the
 * undefined variable, and a snippet of the offending line so the thrown error
 * answers "why did it fail and what data was missing?". The original error is
 * always attached as `cause`.
 *
 * @param cause   the error thrown by the underlying engine
 * @param source  the template source that was being rendered
 * @param context the data object passed to the render
 * @param meta    identity of the render (engine, template name, scope, ...)
 */
export function diagnoseRenderError(
    cause: unknown,
    source: string,
    context: Record<string, any> | undefined,
    meta: RenderContextMeta,
): TemplateRenderError {
    const err = toError(cause);
    const contextKeys = context ? Object.keys(context) : [];

    const location = extractLocation(err.message, meta);
    const missingVariable = extractMissingVariable(err.message, source, location);
    const snippet = location ? lineAt(source, location.line) : undefined;

    const reason = missingVariable
        ? `variable "${missingVariable}" is undefined`
        : cleanMessage(err.message);

    const subject = meta.templateName ? `template "${meta.templateName}"` : 'inline content';
    const tags = [
        [meta.engine, meta.language].filter(Boolean).join(' → '),
        meta.scope && `scope=${meta.scope}`,
        meta.locale && `locale=${meta.locale}`,
    ].filter(Boolean);
    const where = tags.length ? ` [${tags.join(', ')}]` : '';

    const message = `Failed to render ${subject}${where}: ${stripTrailingDot(reason)}.`;

    const hint = missingVariable
        ? buildMissingVarHint(missingVariable, contextKeys)
        : stageHint(meta.stage, meta.engine, meta.language);

    return new TemplateRenderError(
        {
            message,
            stage: meta.stage,
            engine: meta.engine,
            language: meta.language,
            templateName: meta.templateName,
            scope: meta.scope,
            scopeId: meta.scopeId,
            locale: meta.locale,
            missingVariable,
            contextKeys,
            location,
            snippet,
            hint,
        },
        err,
    );
}

function buildMissingVarHint(variable: string, contextKeys: string[]): string {
    const provided = contextKeys.length
        ? `The render context has: [${contextKeys.join(', ')}].`
        : `The render context was empty.`;
    return `Pass "${variable}" in the render context. ${provided} To make it optional, guard it in the template, e.g. {{ ${variable} or "" }}.`;
}

function stageHint(stage: RenderStage, engine?: string, language?: string): string | undefined {
    switch (stage) {
        case 'template-engine':
            return `Check the ${engine ?? 'template'} syntax and that every referenced variable is provided.`;
        case 'language-engine':
            return `Check that the content is valid ${language ?? 'markup'} after variable interpolation.`;
        case 'layout':
            return `The error happened while rendering the layout wrapper around this template.`;
        case 'subject':
            return `The error happened while rendering the subject line.`;
        default:
            return undefined;
    }
}

/** Normalize anything thrown into an Error. */
function toError(cause: unknown): Error {
    if (cause instanceof Error) return cause;
    if (typeof cause === 'string') return new Error(cause);
    try {
        return new Error(JSON.stringify(cause));
    } catch {
        return new Error(String(cause));
    }
}

/**
 * Extract a 1-based source location from an engine error message.
 * Handles Nunjucks, Handlebars, EJS and Pug formats, with a generic fallback.
 */
function extractLocation(
    message: string,
    meta: RenderContextMeta,
): { line: number; column?: number } | undefined {
    const patterns: Array<RegExp> = [
        /\[Line (\d+),\s*Column (\d+)\]/i, // nunjucks
        /Parse error on line (\d+)/i, // handlebars
        /(?:ejs|pug):(\d+)/i, // ejs / pug "name:line"
        />>\s*(\d+)\s*\|/, // ejs listing marker
        /\bon line (\d+)(?::(\d+))?/i, // generic "on line N"
        /\bline (\d+)(?::(\d+))?/i, // generic "line N"
    ];
    for (const re of patterns) {
        const m = message.match(re);
        if (m) {
            const line = Number(m[1]);
            const column = m[2] !== undefined ? Number(m[2]) : undefined;
            if (Number.isFinite(line) && line > 0) {
                return column !== undefined && Number.isFinite(column)
                    ? { line, column }
                    : { line };
            }
        }
    }
    return undefined;
}

/**
 * Best-effort detection of the undefined variable that caused the failure.
 * Strategies, in order: JS ReferenceError, Nunjucks "call undefined",
 * then the expression sitting at the reported source location.
 */
function extractMissingVariable(
    message: string,
    source: string,
    location?: { line: number; column?: number },
): string | undefined {
    // EJS / Pug evaluate JS, so a missing var surfaces as a ReferenceError.
    const refError = message.match(/(\b[\w$][\w.$]*) is not defined/);
    if (refError) return refError[1];

    // Nunjucks: "Unable to call `x`, which is undefined"
    const njkCall = message.match(/Unable to call `?([\w.$]+)`?, which is undefined/i);
    if (njkCall) return njkCall[1];

    // Nunjucks: "attempted to output null or undefined value" — resolve via location.
    if (/attempted to output null or undefined value/i.test(message) && location) {
        return expressionAt(source, location);
    }

    return undefined;
}

/** Mustache/scriptlet token shapes across supported engines. */
const TOKEN_RE = /\{\{-?\s*([\s\S]*?)\s*-?\}\}|<%[=\-_]?\s*([\s\S]*?)\s*[-_]?%>|#\{\s*([\s\S]*?)\s*\}/g;

/**
 * Find the variable expression at a source location. Picks the interpolation
 * token containing the column (or the first token on the line) and returns its
 * leading variable path (filters/operators stripped).
 */
function expressionAt(source: string, location: { line: number; column?: number }): string | undefined {
    const lineText = rawLineAt(source, location.line);
    if (!lineText) return undefined;

    const tokens: Array<{ start: number; expr: string }> = [];
    TOKEN_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = TOKEN_RE.exec(lineText)) !== null) {
        const expr = (m[1] ?? m[2] ?? m[3] ?? '').trim();
        if (expr) tokens.push({ start: m.index, expr });
    }
    if (tokens.length === 0) return undefined;

    let chosen = tokens[0];
    if (location.column !== undefined) {
        const col = location.column;
        for (const t of tokens) {
            if (t.start <= col) chosen = t;
        }
    }
    return leadingVariable(chosen.expr);
}

/** From "user.firstName | upper" or "items.length" return the variable path. */
function leadingVariable(expr: string): string | undefined {
    const beforeFilter = expr.split('|')[0].trim();
    const path = beforeFilter.match(/^[\w$][\w.$]*(?:\[[^\]]+\])*/);
    return path ? path[0] : undefined;
}

/** 1-based, trimmed and length-capped line for display in errors. */
function lineAt(source: string, line: number): string | undefined {
    const raw = rawLineAt(source, line);
    if (raw === undefined) return undefined;
    const trimmed = raw.trim();
    return trimmed.length > 200 ? `${trimmed.slice(0, 197)}...` : trimmed;
}

function rawLineAt(source: string, line: number): string | undefined {
    if (!source) return undefined;
    const lines = source.split(/\r?\n/);
    return lines[line - 1];
}

/** Strip engine noise we surface separately (paths, "Error:", line markers). */
function cleanMessage(message: string): string {
    return message
        .replace(/^Error:\s*/i, '')
        .replace(/\(unknown path\)\s*/gi, '')
        .replace(/\[Line \d+,\s*Column \d+\]\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function stripTrailingDot(s: string): string {
    return s.replace(/\.+$/, '');
}

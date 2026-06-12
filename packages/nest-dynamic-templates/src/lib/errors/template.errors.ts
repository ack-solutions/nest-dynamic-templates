import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    InternalServerErrorException,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';

/**
 * Stable, machine-readable codes for every error this library throws.
 * Switch on `error.code` instead of parsing messages.
 */
export enum TemplateErrorCode {
    /** Requested template / layout does not exist in any scope or locale. */
    NOT_FOUND = 'TEMPLATE_NOT_FOUND',
    /** A template / layout failed to render (bad syntax, missing variable, language error). */
    RENDER_FAILED = 'TEMPLATE_RENDER_FAILED',
    /** Render was asked to use an engine that is not enabled or whose peer package is missing. */
    ENGINE_UNAVAILABLE = 'TEMPLATE_ENGINE_UNAVAILABLE',
    /** Caller passed invalid input (e.g. missing `name`/`content`). */
    INVALID_INPUT = 'TEMPLATE_INVALID_INPUT',
    /** Operation not permitted (e.g. mutating a system template without permission). */
    FORBIDDEN = 'TEMPLATE_FORBIDDEN',
    /** A template with the same identity already exists. */
    CONFLICT = 'TEMPLATE_CONFLICT',
}

/** Which step of the pipeline was running when a render failed. */
export type RenderStage = 'subject' | 'template-engine' | 'language-engine' | 'layout';

/**
 * Everything we know about a failure. Serialized as the HTTP response body and
 * available as `error.details` for programmatic handling and logging.
 */
export interface TemplateErrorDetails {
    code: TemplateErrorCode;
    /** Human-readable, single-line summary. */
    message: string;
    stage?: RenderStage;
    engine?: string;
    language?: string;
    templateName?: string;
    scope?: string;
    scopeId?: string;
    locale?: string;
    /** The variable that was missing / undefined, when detectable. */
    missingVariable?: string;
    /** Keys that WERE present in the render context — answers "what data did I pass?". */
    contextKeys?: string[];
    /** Where in the template source the failure occurred. */
    location?: { line: number; column?: number };
    /** The offending source line, trimmed. */
    snippet?: string;
    /** Actionable next step for the developer. */
    hint?: string;
}

const TEMPLATE_ERROR = Symbol.for('nest-dynamic-templates.error');

/** Shape shared by every error this library throws. */
export interface TemplateErrorLike {
    code: TemplateErrorCode;
    details: TemplateErrorDetails;
}

/**
 * True for any error raised by nest-dynamic-templates. Use this as the umbrella
 * `catch` check — each concrete error also extends its matching Nest HTTP
 * exception (so `instanceof NotFoundException` etc. still work).
 */
export function isTemplateError(e: unknown): e is TemplateErrorLike {
    return typeof e === 'object' && e !== null && (e as any)[TEMPLATE_ERROR] === true;
}

function body(name: string, status: number, details: TemplateErrorDetails) {
    return { statusCode: status, error: name, ...details };
}

function cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/** A template or layout could not be found (HTTP 404). */
export class TemplateNotFoundError extends NotFoundException implements TemplateErrorLike {
    readonly code = TemplateErrorCode.NOT_FOUND;
    readonly details: TemplateErrorDetails;
    readonly [TEMPLATE_ERROR] = true;

    constructor(args: {
        templateName: string;
        scope?: string;
        scopeId?: string;
        locale?: string;
        kind?: 'template' | 'layout';
    }) {
        const kind = args.kind ?? 'template';
        const details: TemplateErrorDetails = {
            code: TemplateErrorCode.NOT_FOUND,
            message: `${cap(kind)} "${args.templateName}" was not found in scope "${args.scope ?? 'system'}"${args.locale ? ` for locale "${args.locale}"` : ''}.`,
            templateName: args.templateName,
            scope: args.scope,
            scopeId: args.scopeId,
            locale: args.locale,
            hint: `Create the ${kind} first, or check the name/scope/locale. Resolution falls back to scope "system" and locale "en".`,
        };
        super(body('TemplateNotFoundError', 404, details));
        this.name = 'TemplateNotFoundError';
        this.details = details;
    }
}

/**
 * A template or layout failed to render (HTTP 422). This is the rich,
 * "tell me exactly what went wrong" error. Prefer building it via
 * `diagnoseRenderError`, which fills in the variable, location and snippet.
 */
export class TemplateRenderError extends UnprocessableEntityException implements TemplateErrorLike {
    readonly code = TemplateErrorCode.RENDER_FAILED;
    readonly details: TemplateErrorDetails;
    readonly [TEMPLATE_ERROR] = true;

    constructor(details: Omit<TemplateErrorDetails, 'code'>, cause?: unknown) {
        const full: TemplateErrorDetails = { code: TemplateErrorCode.RENDER_FAILED, ...details };
        super(body('TemplateRenderError', 422, full), {
            cause: cause instanceof Error ? cause : undefined,
        });
        this.name = 'TemplateRenderError';
        this.details = full;
    }
}

/**
 * Render asked for an engine that is not enabled in module config, or whose peer
 * package is not installed (HTTP 500 — a developer/config error).
 */
export class TemplateEngineUnavailableError extends InternalServerErrorException implements TemplateErrorLike {
    readonly code = TemplateErrorCode.ENGINE_UNAVAILABLE;
    readonly details: TemplateErrorDetails;
    readonly [TEMPLATE_ERROR] = true;

    constructor(args: {
        engine: string;
        kind: 'template' | 'language';
        reason: 'not-enabled' | 'not-installed';
        peerPackage?: string;
    }) {
        const { engine, kind, reason, peerPackage } = args;
        const configKey = kind === 'template' ? 'engines.template' : 'engines.language';
        const message =
            reason === 'not-installed'
                ? `${cap(kind)} engine "${engine}" is enabled but its package${peerPackage ? ` "${peerPackage}"` : ''} is not installed.`
                : `${cap(kind)} engine "${engine}" is not enabled.`;
        const hint =
            reason === 'not-installed'
                ? `Run \`npm install ${peerPackage ?? engine}\`.`
                : `Add it to NestDynamicTemplatesModule.forRoot({ ${configKey}: ['${engine}'] }).`;
        const details: TemplateErrorDetails = {
            code: TemplateErrorCode.ENGINE_UNAVAILABLE,
            message,
            engine,
            hint,
        };
        super(body('TemplateEngineUnavailableError', 500, details));
        this.name = 'TemplateEngineUnavailableError';
        this.details = details;
    }
}

/** Caller passed invalid input, e.g. neither `name` nor `content` (HTTP 400). */
export class TemplateInputError extends BadRequestException implements TemplateErrorLike {
    readonly code = TemplateErrorCode.INVALID_INPUT;
    readonly details: TemplateErrorDetails;
    readonly [TEMPLATE_ERROR] = true;

    constructor(message: string, hint?: string) {
        const details: TemplateErrorDetails = { code: TemplateErrorCode.INVALID_INPUT, message, hint };
        super(body('TemplateInputError', 400, details));
        this.name = 'TemplateInputError';
        this.details = details;
    }
}

/** Operation not permitted, e.g. editing a system template (HTTP 403). */
export class TemplateForbiddenError extends ForbiddenException implements TemplateErrorLike {
    readonly code = TemplateErrorCode.FORBIDDEN;
    readonly details: TemplateErrorDetails;
    readonly [TEMPLATE_ERROR] = true;

    constructor(message: string, hint?: string) {
        const details: TemplateErrorDetails = { code: TemplateErrorCode.FORBIDDEN, message, hint };
        super(body('TemplateForbiddenError', 403, details));
        this.name = 'TemplateForbiddenError';
        this.details = details;
    }
}

/** A template with the same identity already exists (HTTP 409). */
export class TemplateConflictError extends ConflictException implements TemplateErrorLike {
    readonly code = TemplateErrorCode.CONFLICT;
    readonly details: TemplateErrorDetails;
    readonly [TEMPLATE_ERROR] = true;

    constructor(message: string, hint?: string) {
        const details: TemplateErrorDetails = { code: TemplateErrorCode.CONFLICT, message, hint };
        super(body('TemplateConflictError', 409, details));
        this.name = 'TemplateConflictError';
        this.details = details;
    }
}

import { TemplateEngineEnum } from '../interfaces/template.types';

/**
 * Base class for template (logic) engines — Nunjucks, Handlebars, EJS, Pug.
 * These interpolate variables and run template logic.
 *
 * Implementations should:
 *  - lazy-load their peer package (so unused engines need no install), and
 *  - let the underlying library's error propagate from `render()` unchanged, so
 *    the service can diagnose it (line/column, missing variable, ...).
 */
export abstract class TemplateEngine {
    /** The enum value this engine is registered under, e.g. `njk`. */
    static engineName: TemplateEngineEnum;
    /** Friendly name for error messages, e.g. `Nunjucks`. */
    static displayName: string;
    /** npm package this engine requires, e.g. `nunjucks`. */
    static peerPackage: string;

    abstract render(content: string, data?: Record<string, any>): Promise<string>;

    abstract validate(content: string): Promise<boolean>;
}

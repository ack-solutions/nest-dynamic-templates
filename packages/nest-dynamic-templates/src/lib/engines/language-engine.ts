import { TemplateLanguageEnum } from '../interfaces/template.types';

/**
 * Base class for language (output) processors — HTML, MJML, Markdown, Text.
 * These run AFTER the template engine has interpolated variables, turning the
 * intermediate output into the final markup.
 */
export abstract class LanguageEngine {
    /** The enum value this engine is registered under, e.g. `mjml`. */
    static engineName: TemplateLanguageEnum;
    /** Friendly name for error messages, e.g. `MJML`. */
    static displayName: string;
    /** npm package this engine requires (if any), e.g. `mjml`. */
    static peerPackage?: string;

    abstract render(content: string, data?: Record<string, any>): Promise<string>;

    abstract validate(content: string): Promise<boolean>;
}

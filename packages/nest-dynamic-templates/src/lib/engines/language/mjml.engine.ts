import { TemplateLanguageEnum } from '../../interfaces/template.types';
import { LanguageEngine } from '../language-engine';

export class MjmlEngine extends LanguageEngine {

    static override engineName = TemplateLanguageEnum.MJML;

    private readonly options: any = {};

    constructor(options: any = {}) {
        super();
        this.options = options;
    }

    async render(content: string): Promise<string> {
        try {
            const mjml2html = (await import('mjml')).default;
            const result = mjml2html(content, {
                ...this.options,
                validationLevel: 'strict',
            });

            if (result.errors && result.errors.length > 0) {
                throw new Error(`MJML validation errors: ${result.errors.join(', ')}`);
            }

            return result.html;
        } catch (error: any) {
            throw new Error(`MJML rendering error: ${error?.message || 'Unknown error'}`);
        }
    }

    async validate(content: string): Promise<boolean> {
        try {
            const mjml2html = (await import('mjml')).default;
            const result = mjml2html(content, {
                validationLevel: 'strict',
            });
            return result.errors.length === 0;
        } catch (error) {
            return false;
        }
    }
}

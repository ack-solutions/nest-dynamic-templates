import { TemplateLanguageEnum } from '../../interfaces/template.types';
import { LanguageEngine } from '../language-engine';

export class HtmlEngine extends LanguageEngine {
    static override engineName = TemplateLanguageEnum.HTML;

    private options: any; // Using any for now since htmlparser2 types are causing issues

    constructor(options?: any) {
        super();
        this.options = options;
    }

    async render(content: string): Promise<string> {
        try {
            // For HTML, we just return the content as is
            // But we validate it first to ensure it's valid HTML
            const isValid = await this.validate(content);
            if (!isValid) {
                throw new Error('Invalid HTML content');
            }
            return content;
        } catch (error: any) {
            throw new Error(`Failed to render HTML: ${error?.message || 'Unknown error'}`);
        }
    }

    async validate(content: string): Promise<boolean> {
        try {
            const { Parser } = await import('htmlparser2');

            return new Promise((resolve) => {
                const parser = new Parser({
                    onerror: () => {
                        resolve(false);
                    },
                    onend: () => {
                        resolve(true);
                    }
                }, this.options);

                parser.write(content);
                parser.end();
            });
        } catch (error) {
            return false;
        }
    }
}

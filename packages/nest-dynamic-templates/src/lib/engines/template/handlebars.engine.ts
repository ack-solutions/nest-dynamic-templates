import { TemplateEngineEnum } from '../../interfaces/template.types';
import { TemplateEngine } from '../template-engine';
import { EngineOptions } from '../../interfaces/module-config.interface';

export class HandlebarsEngine extends TemplateEngine {

    static override engineName = TemplateEngineEnum.HANDLEBARS;

    private options: Handlebars.ParseOptions;

    constructor(options?: EngineOptions<Handlebars.ParseOptions>) {
        super();
        this.options = options || {};
    }

    async render(content: string, data?: Record<string, any>): Promise<string> {
        try {
            const Handlebars = await import('handlebars');
            const template = Handlebars.compile(content, this.options);
            return template(data);
        } catch (error: any) {
            throw new Error(`Failed to render Handlebars template: ${error?.message || 'Unknown error'}`);
        }
    }

    async validate(content: string): Promise<boolean> {
        try {
            const Handlebars = await import('handlebars');
            Handlebars.precompile(content, this.options);
            return true;
        } catch (error) {
            return false;
        }
    }
}

import { TemplateEngine } from '../template-engine';
import { TemplateEngineEnum } from '../../interfaces/template.types';
import { EngineOptions } from '../../interfaces/module-config.interface';
export class EjsEngine extends TemplateEngine {

    static override engineName = TemplateEngineEnum.EJS;

    private options: ejs.Options;

    constructor(options?: EngineOptions<ejs.Options>) {
        super();
        this.options = options || {};
    }

    async render(content: string, data?: Record<string, any>): Promise<string> {
        try {
            const ejs = await import('ejs');
            return ejs.render(content, data, this.options);
        } catch (error: any) {
            throw new Error(`Failed to render EJS template: ${error?.message || 'Unknown error'}`);
        }
    }

    async validate(content: string): Promise<boolean> {
        try {
            const ejs = await import('ejs');
            ejs.compile(content, this.options);
            return true;
        } catch (error) {
            return false;
        }
    }
}

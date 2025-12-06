import type { Options } from 'pug';
import { TemplateEngineEnum } from '../../interfaces/template.types';
import { TemplateEngine } from '../template-engine';
import { CustomEngineOptions, EngineOptions } from '../../interfaces/module-config.interface';

export class PugEngine extends TemplateEngine {

    static override engineName = TemplateEngineEnum.PUG;

    private options: Options;

    constructor(options?: EngineOptions<Options>, private customOptions?: CustomEngineOptions) {
        super();
        this.options = options || {};
    }

    async render(content: string, data: any): Promise<string> {
        try {
            const pug = await import('pug');
            const template = pug.compile(content, {
                ...this.options,
                filters: this.customOptions?.filters
            });
            return template({
                ...this.options.filters,
                ...data,
                ...this.customOptions?.filters
            });
        } catch (error: any) {
            throw new Error(`Failed to render Pug template: ${error?.message || 'Unknown error'}`);
        }
    }

    async validate(content: string): Promise<boolean> {
        try {
            const pug = await import('pug');
            pug.compile(content, this.options);
            return true;
        } catch (error) {
            return false;
        }
    }
}

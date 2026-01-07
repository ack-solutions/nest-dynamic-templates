import { omit } from 'lodash';
import { TemplateEngineEnum } from '../../interfaces/template.types';
import { TemplateEngine } from '../template-engine';
import type { Environment, ConfigureOptions } from 'nunjucks';
import { CustomEngineOptions, EngineOptions } from '../../interfaces/module-config.interface';

export class NunjucksEngine extends TemplateEngine {

    static override engineName = TemplateEngineEnum.NUNJUCKS;

    private env: Environment;

    constructor(private options?: EngineOptions<ConfigureOptions>, private customOptions?: CustomEngineOptions) {
        super();
        this.initNunjucks();
    }

    initNunjucks() {
        const nunjucks = require('nunjucks');

        const nunjucksOptions = omit(this.options, 'filters');

        this.env = nunjucks.configure({
            autoescape: true,
            throwOnUndefined: true,
            ...nunjucksOptions,
        });

        // Register filters immediately
        if (this.customOptions?.filters) {
            Object.entries(this.customOptions.filters).forEach(([name, filter]) => {
                this.registerFilter(name, filter);
            });
        }

        // Register globalValues immediately (can be strings, numbers, objects, or functions)
        if (this.customOptions?.globalValues) {
            Object.entries(this.customOptions.globalValues).forEach(([name, value]) => {
                this.registerGlobal(name, value);
            });
        }
    }

    async render(content: string, data?: Record<string, any>): Promise<string> {
        try {
            return new Promise((resolve, reject) => {
                this.env.renderString(content, data || {}, (err: any, result: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } catch (error: any) {
            throw new Error(`Failed to render Nunjucks template: ${error?.message || 'Unknown error'}`);
        }
    }

    async validate(content: string): Promise<boolean> {
        try {
            // Use renderString with empty data to validate the template
            await this.render(content, {});
            return true;
        } catch (error) {
            return false;
        }
    }

    registerFilter(name: string, filter: (...args: any[]) => any) {
        this.env.addFilter(name, filter);
    }

    registerGlobal(name: string, global: any) {
        this.env.addGlobal(name, global);
    }
}

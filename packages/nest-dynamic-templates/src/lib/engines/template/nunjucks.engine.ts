import { TemplateEngineEnum } from '../../interfaces/template.types';
import { TemplateEngine } from '../template-engine';
import type { Environment, ConfigureOptions } from 'nunjucks';
import { CustomEngineOptions } from '../../interfaces/module-config.interface';
import { loadPeer } from '../load-peer';

export class NunjucksEngine extends TemplateEngine {
    static override engineName = TemplateEngineEnum.NUNJUCKS;
    static override displayName = 'Nunjucks';
    static override peerPackage = 'nunjucks';

    private env?: Environment;

    constructor(
        private readonly options: ConfigureOptions = {},
        private readonly customOptions: CustomEngineOptions = {},
    ) {
        super();
    }

    /** Configure the Nunjucks environment once, on first use (lazy). */
    private async getEnv(): Promise<Environment> {
        if (this.env) return this.env;

        const nunjucks = await loadPeer<typeof import('nunjucks')>('nunjucks', 'njk', 'template');
        const env = nunjucks.configure({
            autoescape: true,
            throwOnUndefined: true,
            ...this.options,
        });

        for (const [name, filter] of Object.entries(this.customOptions.filters ?? {})) {
            env.addFilter(name, filter as any);
        }
        for (const [name, value] of Object.entries(this.customOptions.globals ?? {})) {
            env.addGlobal(name, value);
        }

        this.env = env;
        return env;
    }

    async render(content: string, data?: Record<string, any>): Promise<string> {
        const env = await this.getEnv();
        // Let Nunjucks' own error (with [Line, Column]) propagate to the diagnoser.
        return new Promise<string>((resolve, reject) => {
            env.renderString(content, data || {}, (err, result) => {
                if (err) reject(err);
                else resolve(result ?? '');
            });
        });
    }

    async validate(content: string): Promise<boolean> {
        try {
            await this.render(content, {});
            return true;
        } catch {
            return false;
        }
    }
}

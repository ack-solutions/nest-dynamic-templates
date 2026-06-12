import { TemplateEngine } from '../template-engine';
import { TemplateEngineEnum } from '../../interfaces/template.types';
import { CustomEngineOptions } from '../../interfaces/module-config.interface';
import { loadPeer } from '../load-peer';

export class EjsEngine extends TemplateEngine {
    static override engineName = TemplateEngineEnum.EJS;
    static override displayName = 'EJS';
    static override peerPackage = 'ejs';

    constructor(
        private readonly options: Record<string, any> = {},
        private readonly customOptions: CustomEngineOptions = {},
    ) {
        super();
    }

    async render(content: string, data?: Record<string, any>): Promise<string> {
        const ejs = await loadPeer<typeof import('ejs')>('ejs', 'ejs', 'template');
        // Custom filters/globals are exposed as locals so they're callable in EJS.
        const locals = { ...this.customOptions.globals, ...this.customOptions.filters, ...data };
        return ejs.render(content, locals, this.options);
    }

    async validate(content: string): Promise<boolean> {
        try {
            const ejs = await loadPeer<typeof import('ejs')>('ejs', 'ejs', 'template');
            ejs.compile(content, this.options);
            return true;
        } catch {
            return false;
        }
    }
}

import type { Options } from 'pug';
import { TemplateEngineEnum } from '../../interfaces/template.types';
import { TemplateEngine } from '../template-engine';
import { CustomEngineOptions } from '../../interfaces/module-config.interface';
import { loadPeer } from '../load-peer';

export class PugEngine extends TemplateEngine {
    static override engineName = TemplateEngineEnum.PUG;
    static override displayName = 'Pug';
    static override peerPackage = 'pug';

    constructor(
        private readonly options: Options = {},
        private readonly customOptions: CustomEngineOptions = {},
    ) {
        super();
    }

    async render(content: string, data?: Record<string, any>): Promise<string> {
        const pug = await loadPeer<typeof import('pug')>('pug', 'pug', 'template');
        const template = pug.compile(content, this.options);
        // Custom filters/globals are exposed as locals so they're callable in Pug.
        return template({ ...this.customOptions.globals, ...this.customOptions.filters, ...data });
    }

    async validate(content: string): Promise<boolean> {
        try {
            const pug = await loadPeer<typeof import('pug')>('pug', 'pug', 'template');
            pug.compile(content, this.options);
            return true;
        } catch {
            return false;
        }
    }
}

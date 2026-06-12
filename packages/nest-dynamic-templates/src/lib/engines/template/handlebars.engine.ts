import { TemplateEngineEnum } from '../../interfaces/template.types';
import { TemplateEngine } from '../template-engine';
import { CustomEngineOptions } from '../../interfaces/module-config.interface';
import { loadPeer } from '../load-peer';

export class HandlebarsEngine extends TemplateEngine {
    static override engineName = TemplateEngineEnum.HANDLEBARS;
    static override displayName = 'Handlebars';
    static override peerPackage = 'handlebars';

    private instance?: any;

    constructor(
        private readonly options: Record<string, any> = {},
        private readonly customOptions: CustomEngineOptions = {},
    ) {
        super();
    }

    /** Isolated Handlebars instance with custom filters registered as helpers. */
    private async getInstance(): Promise<any> {
        if (this.instance) return this.instance;

        const mod = await loadPeer<any>('handlebars', 'hbs', 'template');
        const Handlebars = mod.default ?? mod;
        const instance = typeof Handlebars.create === 'function' ? Handlebars.create() : Handlebars;

        for (const [name, fn] of Object.entries(this.customOptions.filters ?? {})) {
            instance.registerHelper(name, fn);
        }

        this.instance = instance;
        return instance;
    }

    async render(content: string, data?: Record<string, any>): Promise<string> {
        const Handlebars = await this.getInstance();
        const template = Handlebars.compile(content, this.options);
        return template({ ...this.customOptions.globals, ...data });
    }

    async validate(content: string): Promise<boolean> {
        try {
            const Handlebars = await this.getInstance();
            Handlebars.precompile(content, this.options);
            return true;
        } catch {
            return false;
        }
    }
}

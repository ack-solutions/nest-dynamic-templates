import { TemplateLanguageEnum } from '../../interfaces/template.types';
import { LanguageEngine } from '../language-engine';
import { loadPeer } from '../load-peer';

export class MjmlEngine extends LanguageEngine {
    static override engineName = TemplateLanguageEnum.MJML;
    static override displayName = 'MJML';
    static override peerPackage = 'mjml';

    constructor(private readonly options: Record<string, any> = {}) {
        super();
    }

    async render(content: string): Promise<string> {
        const mod = await loadPeer<any>('mjml', 'mjml', 'language');
        const mjml2html = mod.default ?? mod;

        // 'soft' collects validation issues into result.errors instead of throwing,
        // so we can surface them with line numbers and tag names.
        const result = mjml2html(content, { validationLevel: 'soft', ...this.options });

        if (result.errors && result.errors.length > 0) {
            const message = result.errors
                .map((e: any) => e?.formattedMessage || e?.message || String(e))
                .join('; ');
            throw new Error(`MJML: ${message}`);
        }

        return result.html;
    }

    async validate(content: string): Promise<boolean> {
        try {
            const mod = await loadPeer<any>('mjml', 'mjml', 'language');
            const mjml2html = mod.default ?? mod;
            const result = mjml2html(content, { validationLevel: 'soft', ...this.options });
            return !result.errors || result.errors.length === 0;
        } catch {
            return false;
        }
    }
}

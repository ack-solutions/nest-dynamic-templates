import { TemplateLanguageEnum } from '../../interfaces/template.types';
import { LanguageEngine } from '../language-engine';
import { loadPeer } from '../load-peer';

/**
 * Markdown processor backed by `marked` (lazy, optional peer). Converts the
 * interpolated Markdown into HTML.
 */
export class MarkdownEngine extends LanguageEngine {
    static override engineName = TemplateLanguageEnum.MARKDOWN;
    static override displayName = 'Markdown';
    static override peerPackage = 'marked';

    constructor(private readonly options: Record<string, any> = {}) {
        super();
    }

    async render(content: string): Promise<string> {
        const mod = await loadPeer<any>('marked', 'md', 'language');
        const marked = mod.marked ?? mod.default ?? mod;
        const out = typeof marked.parse === 'function'
            ? marked.parse(content, this.options)
            : marked(content, this.options);
        return typeof out === 'string' ? out : await out;
    }

    async validate(content: string): Promise<boolean> {
        try {
            await this.render(content);
            return true;
        } catch {
            return false;
        }
    }
}

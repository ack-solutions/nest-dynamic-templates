import { TemplateLanguageEnum } from '../../interfaces/template.types';
import { LanguageEngine } from '../language-engine';

/** Plain-text processor — pass-through, no transformation. */
export class TextEngine extends LanguageEngine {
    static override engineName = TemplateLanguageEnum.TEXT;
    static override displayName = 'Text';

    async render(content: string): Promise<string> {
        return content;
    }

    async validate(): Promise<boolean> {
        return true;
    }
}

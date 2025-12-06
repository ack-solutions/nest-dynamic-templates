import { TemplateLanguageEnum } from '../../interfaces/template.types';
import { LanguageEngine } from '../language-engine';

export class TextEngine extends LanguageEngine {

    static override engineName = TemplateLanguageEnum.TEXT;

    async render(content: string): Promise<string> {
        return content;
    }

    async validate(content: string): Promise<boolean> {
        return true;
    }
}

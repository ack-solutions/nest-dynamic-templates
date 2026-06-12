import { TemplateLanguageEnum } from '../../interfaces/template.types';
import { LanguageEngine } from '../language-engine';

/**
 * HTML "processor". After the template engine has interpolated variables the
 * content is already HTML, so this is a pass-through. (Earlier versions ran a
 * strict htmlparser2 validation here that rejected perfectly valid output —
 * that behaviour has been removed.)
 */
export class HtmlEngine extends LanguageEngine {
    static override engineName = TemplateLanguageEnum.HTML;
    static override displayName = 'HTML';

    async render(content: string): Promise<string> {
        return content;
    }

    async validate(): Promise<boolean> {
        return true;
    }
}

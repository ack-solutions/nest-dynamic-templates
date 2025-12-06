import { Injectable } from '@nestjs/common';
import { TemplateLanguageEnum } from '../../interfaces/template.types';
import { LanguageEngine } from '../language-engine';

@Injectable()
export class MarkdownEngine extends LanguageEngine {
    static override engineName = TemplateLanguageEnum.MARKDOWN;

    private options: any; // Using any for now since marked types are causing issues

    constructor(options?: any) {
        super();
        this.options = options;
    }

    async render(content: string): Promise<string> {
        // try {
        //     const { marked } = await import('marked');
        //     return marked(content, this.options);
        // } catch (error: any) {
        //     throw new Error(`Failed to render Markdown: ${error?.message || 'Unknown error'}`);
        // }
        return content;
    }

    async validate(content: string): Promise<boolean> {
        // try {
        //     const { marked } = await import('marked');
        //     // Basic Markdown validation - check for common syntax errors
        //     marked(content, this.options);
        //     return true;
        // } catch (error) {
        //     return false;
        // }
        return true;
    }
}

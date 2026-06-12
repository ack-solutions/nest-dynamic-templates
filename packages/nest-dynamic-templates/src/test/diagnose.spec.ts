import { diagnoseRenderError } from '../lib/errors/diagnose';
import { TemplateErrorCode } from '../lib/errors/template.errors';
import { HttpStatus } from '@nestjs/common';

describe('diagnoseRenderError', () => {
    const source = [
        '<h1>Welcome</h1>',
        '<p>Hello {{ user.firstName | upper }}</p>',
        '<footer>{{ year }}</footer>',
    ].join('\n');

    it('extracts the missing variable, location and snippet from a Nunjucks undefined error', () => {
        const cause = new Error('(unknown path) [Line 2, Column 10]\n  Error: attempted to output null or undefined value');

        const err = diagnoseRenderError(cause, source, { email: 'a@b.com' }, {
            stage: 'template-engine',
            engine: 'njk',
            language: 'html',
            templateName: 'welcome-email',
            scope: 'system',
            locale: 'en',
        });

        expect(err.code).toBe(TemplateErrorCode.RENDER_FAILED);
        expect(err.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(err.details.missingVariable).toBe('user.firstName');
        expect(err.details.location).toEqual({ line: 2, column: 10 });
        expect(err.details.snippet).toBe('<p>Hello {{ user.firstName | upper }}</p>');
        expect(err.details.contextKeys).toEqual(['email']);
        expect(err.details.templateName).toBe('welcome-email');
        expect(err.message).toContain('variable "user.firstName" is undefined');
        // The original error is preserved.
        expect((err as any).cause).toBe(cause);
        // Hint tells the developer what they passed.
        expect(err.details.hint).toContain('email');
    });

    it('extracts a missing variable from a JS ReferenceError (EJS/Pug style)', () => {
        const cause = new ReferenceError('orderId is not defined');

        const err = diagnoseRenderError(cause, '<%= orderId %>', { name: 'Jo' }, {
            stage: 'template-engine',
            engine: 'ejs',
        });

        expect(err.details.missingVariable).toBe('orderId');
        expect(err.message).toContain('variable "orderId" is undefined');
    });

    it('parses Handlebars parse-error line numbers', () => {
        const cause = new Error('Parse error on line 2:\n...unexpected token');

        const err = diagnoseRenderError(cause, source, {}, {
            stage: 'template-engine',
            engine: 'hbs',
        });

        expect(err.details.location?.line).toBe(2);
        expect(err.details.contextKeys).toEqual([]);
    });

    it('falls back to a clean message when nothing structured can be extracted', () => {
        const cause = new Error('MJML validation: mj-column must be inside mj-section');

        const err = diagnoseRenderError(cause, '<mjml>...</mjml>', { a: 1 }, {
            stage: 'language-engine',
            language: 'mjml',
            templateName: 'newsletter',
        });

        expect(err.details.missingVariable).toBeUndefined();
        expect(err.message).toContain('Failed to render template "newsletter"');
        expect(err.message).toContain('mj-column must be inside mj-section');
        expect(err.details.stage).toBe('language-engine');
    });

    it('never throws on weird input', () => {
        expect(() => diagnoseRenderError('boom', '', undefined, { stage: 'template-engine' })).not.toThrow();
        expect(() => diagnoseRenderError(null, '', {}, { stage: 'layout' })).not.toThrow();
    });
});

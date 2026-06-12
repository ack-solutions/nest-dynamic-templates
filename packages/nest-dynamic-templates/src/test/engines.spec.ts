import { DataSource } from 'typeorm';
import { createTestModule } from './test.setup';
import { TemplateService } from '../lib/services/template.service';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../lib/interfaces/template.types';

describe('Engines', () => {
    let service: TemplateService;
    let dataSource: DataSource;

    beforeEach(async () => {
        const moduleRef = await createTestModule({
            engines: {
                template: [TemplateEngineEnum.NUNJUCKS, TemplateEngineEnum.HANDLEBARS, TemplateEngineEnum.EJS],
                language: [TemplateLanguageEnum.HTML, TemplateLanguageEnum.MARKDOWN, TemplateLanguageEnum.TEXT],
            },
            filters: {
                shout: (s: string) => String(s).toUpperCase(),
            },
            globals: {
                brand: 'Acme',
            },
        });
        service = moduleRef.get(TemplateService);
        dataSource = moduleRef.get(DataSource);
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it('renders Markdown to HTML via the marked engine', async () => {
        const out = await service.renderContent({
            content: '# Hello {{ name }}',
            engine: TemplateEngineEnum.NUNJUCKS,
            language: TemplateLanguageEnum.MARKDOWN,
            context: { name: 'World' },
        });
        expect(out).toContain('<h1>');
        expect(out).toContain('Hello World');
    });

    it('exposes custom filters as Handlebars helpers (cross-engine filters)', async () => {
        const out = await service.renderContent({
            content: '{{shout name}}',
            engine: TemplateEngineEnum.HANDLEBARS,
            language: TemplateLanguageEnum.TEXT,
            context: { name: 'hi' },
        });
        expect(out).toBe('HI');
    });

    it('exposes globals to EJS', async () => {
        const out = await service.renderContent({
            content: '<%= brand %>',
            engine: TemplateEngineEnum.EJS,
            language: TemplateLanguageEnum.TEXT,
            context: {},
        });
        expect(out).toBe('Acme');
    });
});

import { resolveConfig, DEFAULT_ENGINES } from '../lib/config/resolve-config';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../lib/interfaces/template.types';

describe('resolveConfig', () => {
    it('applies defaults when nothing is provided', () => {
        const c = resolveConfig();
        expect(c.engines.template).toEqual(DEFAULT_ENGINES.template);
        expect(c.engines.language).toEqual(DEFAULT_ENGINES.language);
        expect(c.filters).toEqual({});
        expect(c.globals).toEqual({});
    });

    it('REPLACES the engine list instead of concatenating with defaults', () => {
        const c = resolveConfig({ engines: { template: [TemplateEngineEnum.HANDLEBARS] } });
        // The v1 deepmerge bug produced ['njk', 'hbs']; v2 narrows correctly.
        expect(c.engines.template).toEqual([TemplateEngineEnum.HANDLEBARS]);
        // Untouched lists still fall back to defaults.
        expect(c.engines.language).toEqual(DEFAULT_ENGINES.language);
    });

    it('dedupes engine lists', () => {
        const c = resolveConfig({
            engines: { language: [TemplateLanguageEnum.HTML, TemplateLanguageEnum.HTML] },
        });
        expect(c.engines.language).toEqual([TemplateLanguageEnum.HTML]);
    });

    it('passes through the new flat filters/globals/engineOptions', () => {
        const fn = () => 'x';
        const c = resolveConfig({
            filters: { f: fn },
            globals: { brand: 'Acme' },
            engineOptions: { template: { [TemplateEngineEnum.NUNJUCKS]: { autoescape: false } } },
        });
        expect(c.filters.f).toBe(fn);
        expect(c.globals.brand).toBe('Acme');
        expect(c.engineOptions.template[TemplateEngineEnum.NUNJUCKS]).toEqual({ autoescape: false });
    });

    it('maps the deprecated `enginesOptions` shape onto the new fields', () => {
        const fn = () => 'x';
        const c = resolveConfig({
            enginesOptions: {
                filters: { legacy: fn },
                globalValues: { year: 2026 },
                template: { [TemplateEngineEnum.NUNJUCKS]: { trimBlocks: true } },
            },
        } as any);
        expect(c.filters.legacy).toBe(fn);
        expect(c.globals.year).toBe(2026);
        expect(c.engineOptions.template[TemplateEngineEnum.NUNJUCKS]).toEqual({ trimBlocks: true });
    });

    it('lets new fields win over legacy ones', () => {
        const c = resolveConfig({
            globals: { year: 2026 },
            enginesOptions: { globalValues: { year: 1999 } },
        } as any);
        expect(c.globals.year).toBe(2026);
    });
});

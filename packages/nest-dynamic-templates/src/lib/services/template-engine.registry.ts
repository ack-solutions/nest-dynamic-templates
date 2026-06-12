import { Inject, Injectable } from '@nestjs/common';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import { NunjucksEngine } from '../engines/template/nunjucks.engine';
import { MjmlEngine } from '../engines/language/mjml.engine';
import { HtmlEngine } from '../engines/language/html.engine';
import { MarkdownEngine, TextEngine } from '../engines/language';
import { EjsEngine } from '../engines/template/ejs.engine';
import { HandlebarsEngine } from '../engines/template/handlebars.engine';
import { PugEngine } from '../engines/template/pug.engine';
import { TemplateEngine } from '../engines/template-engine';
import { LanguageEngine } from '../engines/language-engine';
import type {
    CustomEngineOptions,
    ResolvedTemplatesConfig,
} from '../interfaces/module-config.interface';
import { NEST_DYNAMIC_TEMPLATES_OPTIONS } from '../constant';
import { TemplateEngineUnavailableError } from '../errors/template.errors';

type TemplateEngineClass = (new (options?: any, custom?: CustomEngineOptions) => TemplateEngine) & {
    engineName: TemplateEngineEnum;
};
type LanguageEngineClass = (new (options?: any) => LanguageEngine) & {
    engineName: TemplateLanguageEnum;
};

/** All engines the library knows how to build. Only enabled ones are instantiated. */
const TEMPLATE_ENGINES: TemplateEngineClass[] = [NunjucksEngine, HandlebarsEngine, EjsEngine, PugEngine];
const LANGUAGE_ENGINES: LanguageEngineClass[] = [MjmlEngine, HtmlEngine, TextEngine, MarkdownEngine];

@Injectable()
export class TemplateEngineRegistryService {
    private readonly templateEngines = new Map<TemplateEngineEnum, TemplateEngine>();
    private readonly languageEngines = new Map<TemplateLanguageEnum, LanguageEngine>();

    constructor(
        @Inject(NEST_DYNAMIC_TEMPLATES_OPTIONS)
        private readonly config: ResolvedTemplatesConfig,
    ) {
        this.registerEnabledEngines();
    }

    private registerEnabledEngines(): void {
        const custom: CustomEngineOptions = {
            filters: this.config.filters,
            globals: this.config.globals,
        };

        for (const Engine of TEMPLATE_ENGINES) {
            if (!this.config.engines.template.includes(Engine.engineName)) continue;
            const options = this.config.engineOptions.template[Engine.engineName];
            this.templateEngines.set(Engine.engineName, new Engine(options, custom));
        }

        for (const Engine of LANGUAGE_ENGINES) {
            if (!this.config.engines.language.includes(Engine.engineName)) continue;
            const options = this.config.engineOptions.language[Engine.engineName];
            this.languageEngines.set(Engine.engineName, new Engine(options));
        }
    }

    getTemplateEngine(format: TemplateEngineEnum): TemplateEngine {
        const engine = this.templateEngines.get(format);
        if (!engine) {
            throw new TemplateEngineUnavailableError({
                engine: format,
                kind: 'template',
                reason: 'not-enabled',
            });
        }
        return engine;
    }

    getLanguageEngine(format: TemplateLanguageEnum): LanguageEngine {
        const engine = this.languageEngines.get(format);
        if (!engine) {
            throw new TemplateEngineUnavailableError({
                engine: format,
                kind: 'language',
                reason: 'not-enabled',
            });
        }
        return engine;
    }

    hasTemplateEngine(format: TemplateEngineEnum): boolean {
        return this.templateEngines.has(format);
    }

    hasLanguageEngine(format: TemplateLanguageEnum): boolean {
        return this.languageEngines.has(format);
    }

    getSupportedTemplateFormats(): TemplateEngineEnum[] {
        return [...this.templateEngines.keys()];
    }

    getSupportedLanguageFormats(): TemplateLanguageEnum[] {
        return [...this.languageEngines.keys()];
    }
}

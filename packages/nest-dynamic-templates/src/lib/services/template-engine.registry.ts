import { Injectable } from '@nestjs/common';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import { NunjucksEngine } from '../engines/template/nunjucks.engine';
import { MjmlEngine } from '../engines/language/mjml.engine';
import { HtmlEngine } from '../engines/language/html.engine';
import { MarkdownEngine, TextEngine } from '../engines/language';
import { EjsEngine } from '../engines/template/ejs.engine';
import { HandlebarsEngine } from '../engines/template/handlebars.engine';
import { PugEngine } from '../engines/template/pug.engine';
import { TemplateConfigService } from './template-config.service';
import { TemplateEngine } from '../engines/template-engine';
import { LanguageEngine } from '../engines/language-engine';
import { NestDynamicTemplatesModuleConfig } from '../interfaces/module-config.interface';

type ClassType<T> = new (...args: any[]) => T;

@Injectable()
export class TemplateEngineRegistryService {
    private templateEngines: Map<TemplateEngineEnum, TemplateEngine> = new Map();
    private languageEngines: Map<TemplateLanguageEnum, LanguageEngine> = new Map();
    private config: NestDynamicTemplatesModuleConfig;

    constructor() {
        this.config = TemplateConfigService.getOptions();

        this.registerTemplateEngines([
            NunjucksEngine,
            HandlebarsEngine,
            EjsEngine,
            PugEngine
        ]);


        this.registerLanguageEngines([
            MjmlEngine,
            HtmlEngine,
            TextEngine,
            MarkdownEngine
        ]);
    }

    registerTemplateEngines(engineClasses: ClassType<TemplateEngine>[]): void {
        engineClasses.forEach(EngineClass => {
            const engineName = (EngineClass as any).engineName;
            if (!engineName) {
                throw new Error(`Engine class ${EngineClass.name} must define static engineName property`);
            }
            const options = (this.config.enginesOptions?.template as any)?.[engineName];

            const customOptions = {
                filters: this.config.enginesOptions?.filters,
                globalValues: this.config.enginesOptions?.globalValues
            }

            this.registerTemplateEngine(engineName, new EngineClass(options, customOptions));
        });
    }

    registerTemplateEngine(format: TemplateEngineEnum, engine: TemplateEngine): void {
        this.templateEngines.set(format, engine);
    }

    registerLanguageEngine(format: TemplateLanguageEnum, engine: LanguageEngine): void {
        this.languageEngines.set(format, engine);
    }

    getTemplateEngine(format: TemplateEngineEnum): TemplateEngine {
        const engine = this.templateEngines.get(format);
        if (!engine) {
            throw new Error(`Template engine not found for format: ${format}`);
        }
        return engine;
    }

    getLanguageEngine(format: TemplateLanguageEnum): LanguageEngine {
        const engine = this.languageEngines.get(format);
        if (!engine) {
            throw new Error(`Language engine not found for format: ${format}`);
        }
        return engine;
    }

    registerLanguageEngines(engineClasses: ClassType<LanguageEngine>[]): void {
        engineClasses.forEach(EngineClass => {
            const engineName = (EngineClass as any).engineName;
            if (!engineName) {
                throw new Error(`Engine class ${EngineClass.name} must define static engineName property`);
            }
            const options = (this.config.enginesOptions?.language as any)?.[engineName];
            this.registerLanguageEngine(engineName, new EngineClass(options));
        });
    }

    hasTemplateEngine(format: TemplateEngineEnum): boolean {
        return this.templateEngines.has(format);
    }

    hasLanguageEngine(format: TemplateLanguageEnum): boolean {
        return this.languageEngines.has(format);
    }

    getSupportedTemplateFormats(): TemplateEngineEnum[] {
        return Array.from(this.templateEngines.keys());
    }

    getSupportedLanguageFormats(): TemplateLanguageEnum[] {
        return Array.from(this.languageEngines.keys());
    }
}

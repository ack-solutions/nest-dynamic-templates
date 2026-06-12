import { Inject, Injectable } from '@nestjs/common';
import type {
    ResolvedTemplatesConfig,
    TemplateFilter,
} from '../interfaces/module-config.interface';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import { NEST_DYNAMIC_TEMPLATES_OPTIONS } from '../constant';

/**
 * Read-only accessor over the fully-resolved module configuration.
 *
 * Injectable (no global mutable state), so it works correctly with both
 * `forRoot()` and `forRootAsync()`.
 */
@Injectable()
export class TemplateConfigService {
    constructor(
        @Inject(NEST_DYNAMIC_TEMPLATES_OPTIONS)
        private readonly config: ResolvedTemplatesConfig,
    ) {}

    /** The full resolved configuration. */
    getOptions(): ResolvedTemplatesConfig {
        return this.config;
    }

    isTemplateEngineEnabled(engine: TemplateEngineEnum): boolean {
        return this.config.engines.template.includes(engine);
    }

    isLanguageEngineEnabled(language: TemplateLanguageEnum): boolean {
        return this.config.engines.language.includes(language);
    }

    getEnabledTemplateEngines(): TemplateEngineEnum[] {
        return this.config.engines.template;
    }

    getEnabledLanguageEngines(): TemplateLanguageEnum[] {
        return this.config.engines.language;
    }

    getTemplateEngineOptions(engine: TemplateEngineEnum): Record<string, any> {
        return this.config.engineOptions.template[engine] ?? {};
    }

    getLanguageEngineOptions(language: TemplateLanguageEnum): Record<string, any> {
        return this.config.engineOptions.language[language] ?? {};
    }

    getFilters(): Record<string, TemplateFilter> {
        return this.config.filters;
    }

    getGlobals(): Record<string, any> {
        return this.config.globals;
    }
}

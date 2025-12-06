import { Injectable } from '@nestjs/common';
import { NestDynamicTemplatesModuleConfig } from '../interfaces/module-config.interface';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';

@Injectable()
export class TemplateConfigService {
    private static config: NestDynamicTemplatesModuleConfig;

    private static readonly defaultConfig: NestDynamicTemplatesModuleConfig = {
        engines: {
            template: [TemplateEngineEnum.NUNJUCKS],
            language: [TemplateLanguageEnum.HTML, TemplateLanguageEnum.MJML, TemplateLanguageEnum.TEXT]
        }
    };

    /**
     * Set the configuration options
     */
    static setOptions(config: NestDynamicTemplatesModuleConfig): void {
        this.config = { ...this.defaultConfig, ...config };
    }

    /**
     * Get the current configuration options
     */
    static getOptions(): NestDynamicTemplatesModuleConfig {
        if (!this.config) {
            return this.defaultConfig;
        }
        return this.config;
    }

    /**
     * Check if configuration has been set
     */
    static hasConfig(): boolean {
        return !!this.config;
    }

    /**
     * Reset configuration to default
     */
    static reset(): void {
        this.config = { ...this.defaultConfig };
    }

    /**
     * Get a specific configuration value
     */
    static get<K extends keyof NestDynamicTemplatesModuleConfig>(
        key: K
    ): NestDynamicTemplatesModuleConfig[K] {
        const config = this.getOptions();
        return config[key];
    }

    /**
     * Check if a template engine is enabled
     */
    static isTemplateEngineEnabled(engine: TemplateEngineEnum): boolean {
        const config = this.getOptions();
        return config.engines?.template?.includes(engine) ?? false;
    }

    /**
     * Check if a language engine is enabled
     */
    static isLanguageEngineEnabled(language: TemplateLanguageEnum): boolean {
        const config = this.getOptions();
        return config.engines?.language?.includes(language) ?? false;
    }

    /**
     * Get enabled template engines
     */
    static getEnabledTemplateEngines(): TemplateEngineEnum[] {
        const config = this.getOptions();
        return config.engines?.template ?? this.defaultConfig.engines!.template!;
    }

    /**
     * Get enabled language engines
     */
    static getEnabledLanguageEngines(): TemplateLanguageEnum[] {
        const config = this.getOptions();
        return config.engines?.language ?? this.defaultConfig.engines!.language!;
    }

    /**
     * Get engine options for a specific template engine
     */
    static getTemplateEngineOptions(engine: TemplateEngineEnum): any {
        const config = this.getOptions();
        return config.enginesOptions?.template?.[engine];
    }

    /**
     * Get engine options for a specific language engine
     */
    static getLanguageEngineOptions(language: TemplateLanguageEnum): any {
        const config = this.getOptions();
        return config.enginesOptions?.language?.[language];
    }

    /**
     * Get custom filters
     */
    static getCustomFilters(): Record<string, Function> {
        const config = this.getOptions();
        return config.enginesOptions?.filters ?? {};
    }
}

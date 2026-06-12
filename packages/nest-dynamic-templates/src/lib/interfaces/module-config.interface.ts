import { TemplateEngineEnum, TemplateLanguageEnum } from './template.types';
import { ModuleMetadata, Type } from '@nestjs/common';

/** A custom filter/helper made available to template engines. */
export type TemplateFilter = (...args: any[]) => any;

/** Custom filters + globals handed to each template engine at construction. */
export interface CustomEngineOptions {
    filters?: Record<string, TemplateFilter>;
    /** Global values injected into every render — strings, numbers, objects or functions. */
    globals?: Record<string, any>;
}

/**
 * Module configuration for `NestDynamicTemplatesModule.forRoot()` /
 * `forRootAsync()`. Every field is optional; sensible defaults are applied.
 */
export interface NestDynamicTemplatesModuleConfig {
    /** Register the module globally so its services can be injected anywhere. */
    isGlobal?: boolean;

    /**
     * Which engines to enable. Only enabled engines are loaded, so you only need
     * to install the peer packages you actually use.
     *
     * @default { template: ['njk'], language: ['html', 'mjml', 'txt'] }
     */
    engines?: {
        template?: TemplateEngineEnum[];
        language?: TemplateLanguageEnum[];
    };

    /** Custom filters/helpers available to every template engine. */
    filters?: Record<string, TemplateFilter>;

    /** Global values injected into every render (strings, numbers, objects or functions). */
    globals?: Record<string, any>;

    /** Raw, per-engine options forwarded to the underlying library. */
    engineOptions?: {
        template?: Partial<Record<TemplateEngineEnum, Record<string, any>>>;
        language?: Partial<Record<TemplateLanguageEnum, Record<string, any>>>;
    };

    /**
     * @deprecated v1 shape. Use top-level `filters`, `globals` and `engineOptions`
     * instead. Still honored (with a one-time warning) for a smooth migration.
     */
    enginesOptions?: {
        filters?: Record<string, TemplateFilter>;
        globalValues?: Record<string, any>;
        template?: Partial<Record<TemplateEngineEnum, Record<string, any>>>;
        language?: Partial<Record<TemplateLanguageEnum, Record<string, any>>>;
    };
}

/**
 * Fully-resolved configuration with all defaults applied. This is what the
 * library injects internally (via the `NEST_DYNAMIC_TEMPLATES_OPTIONS` token).
 */
export interface ResolvedTemplatesConfig {
    isGlobal: boolean;
    engines: {
        template: TemplateEngineEnum[];
        language: TemplateLanguageEnum[];
    };
    filters: Record<string, TemplateFilter>;
    globals: Record<string, any>;
    engineOptions: {
        template: Partial<Record<TemplateEngineEnum, Record<string, any>>>;
        language: Partial<Record<TemplateLanguageEnum, Record<string, any>>>;
    };
}

/** Factory interface for `forRootAsync({ useClass / useExisting })`. */
export interface NestDynamicTemplatesModuleOptionsFactory {
    createNestDynamicTemplatesModuleOptions():
        | Promise<NestDynamicTemplatesModuleConfig>
        | NestDynamicTemplatesModuleConfig;
}

/** Async configuration for `NestDynamicTemplatesModule.forRootAsync()`. */
export interface NestDynamicTemplatesModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    isGlobal?: boolean;
    useExisting?: Type<NestDynamicTemplatesModuleOptionsFactory>;
    useClass?: Type<NestDynamicTemplatesModuleOptionsFactory>;
    useFactory?: (
        ...args: any[]
    ) => Promise<NestDynamicTemplatesModuleConfig> | NestDynamicTemplatesModuleConfig;
    inject?: any[];
}

import { TemplateEngineEnum, TemplateLanguageEnum } from './template.types';
import { ModuleMetadata, Type } from '@nestjs/common';

export interface EngineConfig {
    enabled: boolean;
    options?: Record<string, any>;
}

export interface FilterOptions {
    name: string;
    filter: (...args: any[]) => any;
}

export type EngineOptions<T> = T & {

};

export type CustomEngineOptions = {
    filters?: Record<string, FilterOptions['filter']>;
    globalValues?: Record<string, any>; // Can be strings, numbers, objects, or functions
};

export interface NestDynamicTemplatesModuleConfig {
    isGlobal?: boolean;
    enginesOptions?: {
        filters?: CustomEngineOptions['filters'];
        globalValues?: CustomEngineOptions['globalValues'];
        template?: Partial<Record<TemplateEngineEnum, EngineOptions<any>>>;
        language?: Partial<Record<TemplateLanguageEnum, EngineOptions<any>>>;
    };
    engines?: {
        template?: TemplateEngineEnum[];
        language?: TemplateLanguageEnum[];
    };
}

/**
 * Interface for async module configuration factory
 */
export interface NestDynamicTemplatesModuleOptionsFactory {
    createNestDynamicTemplatesModuleOptions(): Promise<NestDynamicTemplatesModuleConfig> | NestDynamicTemplatesModuleConfig;
}

/**
 * Interface for async module configuration
 */
export interface NestDynamicTemplatesModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    isGlobal?: boolean;
    useExisting?: Type<NestDynamicTemplatesModuleOptionsFactory>;
    useClass?: Type<NestDynamicTemplatesModuleOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<NestDynamicTemplatesModuleConfig> | NestDynamicTemplatesModuleConfig;
    inject?: any[];
}

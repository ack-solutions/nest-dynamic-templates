import { Module, DynamicModule, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestDynamicTemplate } from './entities/template.entity';
import { NestDynamicTemplateLayout } from './entities/template-layout.entity';
import {
  NestDynamicTemplatesModuleConfig,
  NestDynamicTemplatesModuleAsyncOptions,
  NestDynamicTemplatesModuleOptionsFactory
} from './interfaces/module-config.interface';
import deepmerge from 'deepmerge';
import { TemplateEngineRegistryService } from './services/template-engine.registry';
import { TemplateLayoutService } from './services/template-layout.service';
import { TemplateService } from './services/template.service';
import { TemplateConfigService } from './services/template-config.service';
import { NEST_DYNAMIC_TEMPLATES_ASYNC_OPTIONS_PROVIDER } from './constant';
import { TemplateEngineEnum } from './interfaces/template.types';
import { TemplateLanguageEnum } from './interfaces/template.types';


const defaultConfig: NestDynamicTemplatesModuleConfig = {
  engines: {
    template: [TemplateEngineEnum.NUNJUCKS],
    language: [TemplateLanguageEnum.HTML, TemplateLanguageEnum.MJML, TemplateLanguageEnum.TEXT]
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([NestDynamicTemplate, NestDynamicTemplateLayout])],
  providers: [
    TemplateConfigService,
    TemplateEngineRegistryService,
    TemplateLayoutService,
    TemplateService,
  ],
  exports: [
    TemplateConfigService,
    TemplateService,
    TemplateLayoutService,
  ],
})
export class NestDynamicTemplatesModule {
  static moduleDefaultOptions: Partial<NestDynamicTemplatesModuleConfig> = defaultConfig;

  static forRoot(config: NestDynamicTemplatesModuleConfig = {}): DynamicModule {
    const mergedConfig = this.getOptions(config);

    // Set options in static service
    TemplateConfigService.setOptions(mergedConfig);

    return {
      module: NestDynamicTemplatesModule,
      global: mergedConfig.isGlobal,
      imports: [
        TypeOrmModule.forFeature([NestDynamicTemplate, NestDynamicTemplateLayout]),
      ],
      providers: [
        TemplateConfigService,
        TemplateEngineRegistryService,
        TemplateLayoutService,
        TemplateService,
      ],
      exports: [
        TemplateConfigService,
        TemplateService,
        TemplateLayoutService,
      ],
    };
  }

  static forRootAsync(options: NestDynamicTemplatesModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: NestDynamicTemplatesModule,
      global: options.isGlobal,
      imports: [
        TypeOrmModule.forFeature([NestDynamicTemplate, NestDynamicTemplateLayout]),
        ...(options.imports || []),
      ],
      providers: [
        ...asyncProviders,
        TemplateConfigService,
        TemplateEngineRegistryService,
        TemplateLayoutService,
        TemplateService,
      ],
      exports: [
        TemplateConfigService,
        TemplateService,
        TemplateLayoutService,
      ],
    };
  }

  private static createAsyncProviders(options: NestDynamicTemplatesModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    if (options.useClass) {
      return [
        this.createAsyncOptionsProvider(options),
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      ];
    }

    return [];
  }

  private static createAsyncOptionsProvider(options: NestDynamicTemplatesModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: NEST_DYNAMIC_TEMPLATES_ASYNC_OPTIONS_PROVIDER,
        useFactory: async (...args: any[]) => {
          const userOptions = options.useFactory ? await options.useFactory(...args) : {};
          const mergedOptions = this.getOptions(userOptions);
          TemplateConfigService.setOptions(mergedOptions);
          return mergedOptions;
        },
        inject: options.inject || [],
      };
    }

    return {
      provide: NEST_DYNAMIC_TEMPLATES_ASYNC_OPTIONS_PROVIDER,
      useFactory: async (optionsFactory: NestDynamicTemplatesModuleOptionsFactory) => {
        const userOptions = await optionsFactory.createNestDynamicTemplatesModuleOptions();
        const mergedOptions = this.getOptions(userOptions);
        TemplateConfigService.setOptions(mergedOptions);
        return mergedOptions;
      },
      inject: [options.useExisting || options.useClass!],
    };
  }

  private static getOptions(options: NestDynamicTemplatesModuleConfig): NestDynamicTemplatesModuleConfig {
    return deepmerge(this.moduleDefaultOptions, options);
  }

}

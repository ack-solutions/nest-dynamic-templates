import { Module, DynamicModule, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestDynamicTemplate } from './entities/template.entity';
import { NestDynamicTemplateLayout } from './entities/template-layout.entity';
import {
    NestDynamicTemplatesModuleConfig,
    NestDynamicTemplatesModuleAsyncOptions,
    NestDynamicTemplatesModuleOptionsFactory,
} from './interfaces/module-config.interface';
import { TemplateEngineRegistryService } from './services/template-engine.registry';
import { TemplateLayoutService } from './services/template-layout.service';
import { TemplateService } from './services/template.service';
import { TemplateConfigService } from './services/template-config.service';
import { NEST_DYNAMIC_TEMPLATES_OPTIONS } from './constant';
import { resolveConfig } from './config/resolve-config';

const SERVICES: Provider[] = [
    TemplateConfigService,
    TemplateEngineRegistryService,
    TemplateLayoutService,
    TemplateService,
];

const EXPORTS = [
    TemplateConfigService,
    TemplateService,
    TemplateLayoutService,
    TemplateEngineRegistryService,
];

const ENTITIES = TypeOrmModule.forFeature([NestDynamicTemplate, NestDynamicTemplateLayout]);

@Module({})
export class NestDynamicTemplatesModule {
    static forRoot(config: NestDynamicTemplatesModuleConfig = {}): DynamicModule {
        const resolved = resolveConfig(config);

        return {
            module: NestDynamicTemplatesModule,
            global: resolved.isGlobal,
            imports: [ENTITIES],
            providers: [
                { provide: NEST_DYNAMIC_TEMPLATES_OPTIONS, useValue: resolved },
                ...SERVICES,
            ],
            exports: EXPORTS,
        };
    }

    static forRootAsync(options: NestDynamicTemplatesModuleAsyncOptions): DynamicModule {
        return {
            module: NestDynamicTemplatesModule,
            global: options.isGlobal,
            imports: [ENTITIES, ...(options.imports || [])],
            providers: [...this.createAsyncOptionsProviders(options), ...SERVICES],
            exports: EXPORTS,
        };
    }

    private static createAsyncOptionsProviders(
        options: NestDynamicTemplatesModuleAsyncOptions,
    ): Provider[] {
        if (options.useFactory) {
            return [
                {
                    provide: NEST_DYNAMIC_TEMPLATES_OPTIONS,
                    useFactory: async (...args: any[]) =>
                        resolveConfig(await options.useFactory!(...args)),
                    inject: options.inject || [],
                },
            ];
        }

        const providers: Provider[] = [
            {
                provide: NEST_DYNAMIC_TEMPLATES_OPTIONS,
                useFactory: async (factory: NestDynamicTemplatesModuleOptionsFactory) =>
                    resolveConfig(await factory.createNestDynamicTemplatesModuleOptions()),
                inject: [options.useExisting || options.useClass!],
            },
        ];

        if (options.useClass) {
            providers.push({ provide: options.useClass, useClass: options.useClass });
        }

        return providers;
    }
}

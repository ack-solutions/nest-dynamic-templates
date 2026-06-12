import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import {
    NestDynamicTemplatesModuleConfig,
    ResolvedTemplatesConfig,
} from '../interfaces/module-config.interface';

/** The single source of truth for default configuration. */
export const DEFAULT_ENGINES = {
    template: [TemplateEngineEnum.NUNJUCKS] as TemplateEngineEnum[],
    language: [
        TemplateLanguageEnum.HTML,
        TemplateLanguageEnum.MJML,
        TemplateLanguageEnum.TEXT,
    ] as TemplateLanguageEnum[],
};

let warnedAboutLegacy = false;

/**
 * Merge user configuration over the defaults and apply backwards-compatible
 * mapping of the deprecated `enginesOptions` shape.
 *
 * Arrays (the engine lists) are REPLACED, not concatenated — so passing
 * `{ engines: { template: ['hbs'] } }` gives you exactly `['hbs']`.
 */
export function resolveConfig(
    config: NestDynamicTemplatesModuleConfig = {},
): ResolvedTemplatesConfig {
    const legacy = mapLegacy(config);

    return {
        isGlobal: config.isGlobal ?? false,
        engines: {
            template: dedupe(config.engines?.template ?? DEFAULT_ENGINES.template),
            language: dedupe(config.engines?.language ?? DEFAULT_ENGINES.language),
        },
        filters: { ...legacy.filters, ...config.filters },
        globals: { ...legacy.globals, ...config.globals },
        engineOptions: {
            template: { ...legacy.engineOptions.template, ...config.engineOptions?.template },
            language: { ...legacy.engineOptions.language, ...config.engineOptions?.language },
        },
    };
}

/** Translate the deprecated v1 `enginesOptions` block into the new fields. */
function mapLegacy(config: NestDynamicTemplatesModuleConfig) {
    const legacy = config.enginesOptions;
    if (legacy && !warnedAboutLegacy) {
        warnedAboutLegacy = true;
        // eslint-disable-next-line no-console
        console.warn(
            '[nest-dynamic-templates] `enginesOptions` is deprecated. Use top-level ' +
                '`filters`, `globals` and `engineOptions` instead. See the v2 migration guide.',
        );
    }
    return {
        filters: legacy?.filters ?? {},
        globals: legacy?.globalValues ?? {},
        engineOptions: {
            template: legacy?.template ?? {},
            language: legacy?.language ?? {},
        },
    };
}

function dedupe<T>(items: T[]): T[] {
    return Array.from(new Set(items));
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, IsNull, Not, Repository } from 'typeorm';
import { NestDynamicTemplateLayout } from '../entities/template-layout.entity';
import { TemplateLayoutFilterDto } from '../dto/template-layout-filter.dto';
import { TemplateEngineRegistryService } from './template-engine.registry';
import { RenderTemplateLayoutDto, RenderTemplateLayoutOutput } from '../dto/render-template-layout.dto';
import { CreateTemplateLayoutDto } from '../dto/create-template-layout.dto';
import { RenderContentTemplateLayoutDto } from '../dto/render-content-template-layout.dto';
import {
    TemplateConflictError,
    TemplateForbiddenError,
    TemplateInputError,
    TemplateNotFoundError,
    isTemplateError,
} from '../errors/template.errors';
import { diagnoseRenderError, RenderContextMeta } from '../errors/diagnose';

@Injectable()
export class TemplateLayoutService {
    constructor(
        @InjectRepository(NestDynamicTemplateLayout)
        private readonly layoutRepository: Repository<NestDynamicTemplateLayout>,
        private readonly engineRegistry: TemplateEngineRegistryService,
    ) { }

    /**
     * Render a stored layout. The wrapped content is expected on `context.content`.
     */
    async render(renderDto: RenderTemplateLayoutDto): Promise<RenderTemplateLayoutOutput> {
        const { name, scopeId, locale, context } = renderDto;
        const scope = renderDto.scope || 'system';

        const layout = await this.findTemplateLayout(name, scope, scopeId, locale);
        if (!layout) {
            throw new TemplateNotFoundError({ templateName: name, scope, scopeId, locale, kind: 'layout' });
        }
        if (!layout.content) {
            throw new TemplateInputError(`Layout "${name}" has no content to render.`);
        }

        const ctx = context || {};
        const meta = (stage: RenderContextMeta['stage']): RenderContextMeta => ({
            stage,
            engine: layout.engine,
            language: layout.language,
            templateName: name,
            scope,
            scopeId,
            locale,
        });

        let content = layout.content;
        if (layout.engine) {
            try {
                content = await this.engineRegistry.getTemplateEngine(layout.engine).render(content, ctx);
            } catch (error) {
                throw this.asRenderError(error, layout.content, ctx, meta('template-engine'));
            }
        }
        if (layout.language) {
            try {
                content = await this.engineRegistry.getLanguageEngine(layout.language).render(content, ctx);
            } catch (error) {
                throw this.asRenderError(error, content, ctx, meta('language-engine'));
            }
        }

        return { content };
    }

    /** Render a raw layout content string directly. */
    async renderContent(input: RenderContentTemplateLayoutDto): Promise<string> {
        const { content, language, engine, context } = input;
        const ctx = context || {};

        if (!content) {
            throw new TemplateInputError('`content` is required for layout rendering.');
        }

        let rendered = content;
        if (engine) {
            try {
                rendered = await this.engineRegistry.getTemplateEngine(engine).render(content, ctx);
            } catch (error) {
                throw this.asRenderError(error, content, ctx, { stage: 'template-engine', engine, language });
            }
        }
        if (language) {
            try {
                rendered = await this.engineRegistry.getLanguageEngine(language).render(rendered, ctx);
            } catch (error) {
                throw this.asRenderError(error, rendered, ctx, { stage: 'language-engine', engine, language });
            }
        }

        return rendered;
    }

    private asRenderError(
        error: unknown,
        source: string,
        context: Record<string, any>,
        meta: RenderContextMeta,
    ): Error {
        if (isTemplateError(error)) return error as unknown as Error;
        return diagnoseRenderError(error, source, context, meta);
    }

    /**
     * Get all layouts, with scoped layouts taking precedence over system layouts
     */
    async getTemplateLayouts(filter: TemplateLayoutFilterDto = {}): Promise<NestDynamicTemplateLayout[]> {
        const { scope, scopeId, type, locale, excludeNames = [] } = filter;

        const where: any = {};
        if (type) where.type = type;
        if (locale) where.locale = locale;
        if (excludeNames.length > 0) where.name = Not(In(excludeNames));

        const systemTemplates = await this.layoutRepository.find({
            where: { ...where, scope: 'system', scopeId: IsNull() },
        });

        if (scope === 'system') {
            return systemTemplates;
        }

        const templates = await this.layoutRepository.find({
            where: { ...where, scope: Equal(scope), scopeId: scopeId as any },
            order: { createdAt: 'DESC' },
        });

        const templateMap = new Map<string, NestDynamicTemplateLayout>();
        for (const template of systemTemplates) {
            templateMap.set(`${template.type}/${template.name}/${template.locale}`, template);
        }
        for (const template of templates) {
            templateMap.set(`${template.type}/${template.name}/${template.locale}`, template);
        }

        return Array.from(templateMap.values());
    }

    async getTemplateLayoutById(id: string): Promise<NestDynamicTemplateLayout | null> {
        return this.layoutRepository.findOne({ where: { id } });
    }

    /**
     * Resolve a layout by name (scope/locale fallback to system/'en').
     * Only active layouts are considered.
     */
    async findTemplateLayout(
        name: string,
        scope?: string,
        scopeId?: string,
        locale?: string,
    ): Promise<NestDynamicTemplateLayout | null> {
        const locales = (locale ? [locale, 'en'] : ['en']).filter(Boolean);

        for (const currentLocale of locales) {
            const template = await this.layoutRepository.findOne({
                where: {
                    name,
                    scope,
                    scopeId: scope === 'system' ? IsNull() : Equal(scopeId),
                    locale: currentLocale,
                    isActive: true,
                },
            });
            if (template) return template;
        }

        if (scope !== 'system') {
            for (const currentLocale of locales) {
                const template = await this.layoutRepository.findOne({
                    where: {
                        name,
                        scope: 'system',
                        scopeId: IsNull(),
                        locale: currentLocale,
                        isActive: true,
                    },
                });
                if (template) return template;
            }
        }

        return null;
    }

    /**
     * Create a system layout. Only system layouts can be created directly.
     */
    async createTemplateLayout(data: CreateTemplateLayoutDto): Promise<NestDynamicTemplateLayout> {
        if (data.scope !== 'system') {
            throw new TemplateForbiddenError('Only system layouts can be created directly.');
        }

        const existingTemplate = await this.layoutRepository.findOne({
            where: { name: data.name, scope: 'system', scopeId: IsNull(), locale: data.locale },
        });
        if (existingTemplate) {
            throw new TemplateConflictError(
                `A system layout "${data.name}" already exists for locale "${data.locale ?? 'en'}".`,
            );
        }

        const template = this.layoutRepository.create({ ...data, scopeId: undefined });
        return this.layoutRepository.save(template);
    }

    async overwriteSystemTemplateLayout(
        templateId: string,
        updates: Partial<CreateTemplateLayoutDto>,
    ): Promise<NestDynamicTemplateLayout> {
        let template = await this.layoutRepository.findOne({ where: { id: templateId } });
        if (!template) {
            throw new TemplateNotFoundError({ templateName: templateId, kind: 'layout' });
        }

        if (template.scope === 'system') {
            if (!updates.scope) {
                throw new TemplateInputError('`scope` is required when overwriting a system layout.');
            }

            const existingTemplate = await this.layoutRepository.findOne({
                where: {
                    name: template.name,
                    locale: template.locale,
                    scope: updates.scope,
                    scopeId: updates.scopeId as any,
                },
            });

            if (existingTemplate) {
                template = existingTemplate;
            } else {
                template = this.layoutRepository.create({
                    ...template,
                    id: undefined,
                    createdAt: undefined,
                    updatedAt: undefined,
                    scope: updates.scope,
                    scopeId: updates.scopeId,
                });
            }
        }

        template = this.layoutRepository.merge(template, updates);
        await this.layoutRepository.save(template);
        return template;
    }

    /**
     * Update a layout (same system-override semantics as templates).
     */
    async updateTemplateLayout(
        id: string,
        updates: Partial<CreateTemplateLayoutDto>,
        canUpdateSystemTemplate: boolean = false,
    ): Promise<NestDynamicTemplateLayout> {
        let template = await this.layoutRepository.findOne({ where: { id } });
        if (!template) {
            throw new TemplateNotFoundError({ templateName: id, kind: 'layout' });
        }

        if (template.scope === 'system' && !canUpdateSystemTemplate) {
            if (updates.scope) {
                return this.overwriteSystemTemplateLayout(id, updates);
            }
            throw new TemplateForbiddenError('Cannot update a system layout directly.');
        }

        template = this.layoutRepository.merge(template, updates);
        return this.layoutRepository.save(template);
    }

    /**
     * Delete a layout. System layouts require `canDeleteSystemTemplate`.
     */
    async deleteTemplateLayout(id: string, canDeleteSystemTemplate: boolean = false): Promise<void> {
        const template = await this.layoutRepository.findOne({ where: { id } });
        if (!template) {
            throw new TemplateNotFoundError({ templateName: id, kind: 'layout' });
        }

        if (template.scope === 'system' && !canDeleteSystemTemplate) {
            throw new TemplateForbiddenError('Cannot delete a system layout.');
        }

        await this.layoutRepository.remove(template);
    }
}

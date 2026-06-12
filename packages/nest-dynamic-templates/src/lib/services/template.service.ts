import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, Not, In, Equal } from 'typeorm';
import { NestDynamicTemplate } from '../entities/template.entity';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import { RenderTemplateDto, RenderTemplateOutputDTO } from '../dto/render-template.dto';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { TemplateFilterDto } from '../dto/template-filter.dto';
import { TemplateLayoutService } from './template-layout.service';
import { TemplateEngineRegistryService } from './template-engine.registry';
import { omit } from 'lodash';
import { RenderContentTemplateDto } from '../dto/render-content-template.dto';
import {
    TemplateConflictError,
    TemplateForbiddenError,
    TemplateInputError,
    TemplateNotFoundError,
    isTemplateError,
} from '../errors/template.errors';
import { diagnoseRenderError, RenderContextMeta } from '../errors/diagnose';

@Injectable()
export class TemplateService {
    constructor(
        @InjectRepository(NestDynamicTemplate)
        private readonly templateRepository: Repository<NestDynamicTemplate>,
        private readonly engineRegistry: TemplateEngineRegistryService,
        private readonly templateLayoutService: TemplateLayoutService,
    ) { }

    /**
     * Render a stored template, resolving it by scope/locale with fallback to
     * the system scope. Throws a rich {@link TemplateRenderError} on failure.
     */
    async render(renderDto: RenderTemplateDto): Promise<RenderTemplateOutputDTO> {
        const { name, scopeId, locale, context } = renderDto;
        const scope = renderDto.scope || 'system';

        if (!name) {
            throw new TemplateInputError(
                '`name` is required to render a stored template.',
                'To render a raw string instead, use renderContent().',
            );
        }

        const template = await this.findTemplate(name, scope, scopeId, locale);
        if (!template) {
            throw new TemplateNotFoundError({ templateName: name, scope, scopeId, locale });
        }

        const ctx = context || {};
        const meta = (stage: RenderContextMeta['stage']): RenderContextMeta => ({
            stage,
            engine: template.engine,
            language: template.language,
            templateName: name,
            scope,
            scopeId,
            locale,
        });

        // 1. Subject (optional) — rendered with the template engine.
        let subject: string | null = template.subject ?? null;
        if (template.subject && template.engine) {
            try {
                subject = await this.engineRegistry
                    .getTemplateEngine(template.engine)
                    .render(template.subject, ctx);
            } catch (error) {
                throw this.asRenderError(error, template.subject, ctx, meta('subject'));
            }
        }

        // 2. Content — interpolate variables with the template engine.
        let content = template.content;
        if (template.engine) {
            try {
                content = await this.engineRegistry.getTemplateEngine(template.engine).render(content, ctx);
            } catch (error) {
                throw this.asRenderError(error, template.content, ctx, meta('template-engine'));
            }
        }

        // 3a. Layout wraps the content (and handles its own language processing).
        if (template.templateLayoutName) {
            const layout = await this.templateLayoutService.render({
                name: template.templateLayoutName,
                scope,
                scopeId,
                locale,
                context: { ...ctx, content },
            });
            return { subject, content: layout.content };
        }

        // 3b. No layout — run the language processor (HTML/MJML/Markdown/Text).
        if (template.language) {
            try {
                content = await this.engineRegistry.getLanguageEngine(template.language).render(content, ctx);
            } catch (error) {
                throw this.asRenderError(error, content, ctx, meta('language-engine'));
            }
        }

        return { subject, content };
    }

    /**
     * Render a raw content string directly, without fetching from the database.
     */
    async renderContent(input: RenderContentTemplateDto): Promise<string> {
        const { content, language, templateLayoutId } = input;
        const engine = input.engine || TemplateEngineEnum.NUNJUCKS;
        const ctx = input.context || {};

        if (!content) {
            throw new TemplateInputError('`content` is required for renderContent().');
        }

        // 1. Interpolate variables.
        let rendered: string;
        try {
            rendered = await this.engineRegistry.getTemplateEngine(engine).render(content, ctx);
        } catch (error) {
            throw this.asRenderError(error, content, ctx, { stage: 'template-engine', engine, language });
        }

        // 2. Optional layout by id.
        if (templateLayoutId) {
            const layout = await this.templateLayoutService.getTemplateLayoutById(templateLayoutId);
            if (!layout) {
                throw new TemplateNotFoundError({ templateName: templateLayoutId, kind: 'layout' });
            }
            return this.templateLayoutService.renderContent({
                content: layout.content,
                language,
                engine,
                context: { ...ctx, content: rendered },
            });
        }

        // 3. Language processor.
        if (language) {
            try {
                rendered = await this.engineRegistry.getLanguageEngine(language).render(rendered, ctx);
            } catch (error) {
                throw this.asRenderError(error, rendered, ctx, { stage: 'language-engine', engine, language });
            }
        }

        return rendered;
    }

    /** Pass typed library errors through; diagnose raw engine errors. */
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
     * Get all templates, with scoped templates taking precedence over system templates
     */
    async getTemplates(filter: TemplateFilterDto = {}): Promise<NestDynamicTemplate[]> {
        const { scope, scopeId, type, locale, excludeNames = [] } = filter;

        const where: any = {};
        if (type) where.type = type;
        if (locale) where.locale = locale;
        if (excludeNames.length > 0) where.name = Not(In(excludeNames));

        const systemTemplates = await this.templateRepository.find({
            where: { ...where, scope: 'system', scopeId: IsNull() },
        });

        if (scope === 'system') {
            return systemTemplates;
        }

        const templates = await this.templateRepository.find({
            where: { ...where, scope: Equal(scope), scopeId: scopeId as any },
            order: { createdAt: 'DESC' },
        });

        const templateMap = new Map<string, NestDynamicTemplate>();
        for (const template of systemTemplates) {
            templateMap.set(`${template.type}/${template.name}/${template.locale}`, template);
        }
        for (const template of templates) {
            templateMap.set(`${template.type}/${template.name}/${template.locale}`, template);
        }

        return Array.from(templateMap.values());
    }

    async getTemplateById(id: string): Promise<NestDynamicTemplate | null> {
        return this.templateRepository.findOne({ where: { id } });
    }

    /**
     * Resolve a template by name. Resolution order:
     *   1. requested scope + requested locale
     *   2. requested scope + 'en'
     *   3. system scope + requested locale
     *   4. system scope + 'en'
     * Only active templates are considered.
     */
    async findTemplate(
        name: string,
        scope?: string,
        scopeId?: string,
        locale?: string,
    ): Promise<NestDynamicTemplate | null> {
        const locales = (locale ? [locale, 'en'] : ['en']).filter(Boolean);

        for (const currentLocale of locales) {
            const template = await this.templateRepository.findOne({
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
                const template = await this.templateRepository.findOne({
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
     * Create a system template. Only system templates can be created directly.
     */
    async createTemplate(data: CreateTemplateDto): Promise<NestDynamicTemplate> {
        if (data.scope !== 'system') {
            throw new TemplateForbiddenError(
                'Only system templates can be created directly.',
                'To create a scoped override, call overwriteSystemTemplate() or updateTemplate() with a non-system scope.',
            );
        }

        const existingTemplate = await this.templateRepository.findOne({
            where: { name: data.name, scope: 'system', scopeId: IsNull(), locale: data.locale },
        });
        if (existingTemplate) {
            throw new TemplateConflictError(
                `A system template "${data.name}" already exists for locale "${data.locale ?? 'en'}".`,
            );
        }

        const template = this.templateRepository.create({ ...data, scopeId: undefined });
        return this.templateRepository.save(template);
    }

    async overwriteSystemTemplate(
        templateId: string,
        updates: Partial<CreateTemplateDto>,
    ): Promise<NestDynamicTemplate> {
        let template = await this.templateRepository.findOne({ where: { id: templateId } });
        if (!template) {
            throw new TemplateNotFoundError({ templateName: templateId });
        }

        if (template.scope === 'system') {
            if (!updates.scope) {
                throw new TemplateInputError('`scope` is required when overwriting a system template.');
            }

            const existingTemplate = await this.templateRepository.findOne({
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
                template = this.templateRepository.create({
                    ...template,
                    id: undefined,
                    createdAt: undefined,
                    updatedAt: undefined,
                    scope: updates.scope,
                    scopeId: updates.scopeId,
                });
            }
        }

        updates = omit(updates, ['name', 'id', 'createdAt', 'updatedAt']);
        template = this.templateRepository.merge(template, updates);
        await this.templateRepository.save(template);
        return template;
    }

    /**
     * Update a template. A system template can only be updated directly when
     * `canUpdateSystemTemplate` is true; otherwise pass a non-system `scope` to
     * create/update a scoped override instead.
     */
    async updateTemplate(
        id: string,
        updates: Partial<CreateTemplateDto>,
        canUpdateSystemTemplate: boolean = false,
    ): Promise<NestDynamicTemplate> {
        let template = await this.templateRepository.findOne({ where: { id } });
        if (!template) {
            throw new TemplateNotFoundError({ templateName: id });
        }

        if (template.scope === 'system' && !canUpdateSystemTemplate) {
            if (updates.scope) {
                return this.overwriteSystemTemplate(id, updates);
            }
            throw new TemplateForbiddenError(
                'Cannot update a system template directly.',
                'Pass a non-system `scope` to create a scoped override, or call updateTemplate(id, updates, true).',
            );
        }

        template = this.templateRepository.merge(template, updates);
        return this.templateRepository.save(template);
    }

    /**
     * Delete a template. System templates require `canDeleteSystemTemplate`.
     */
    async deleteTemplate(id: string, canDeleteSystemTemplate: boolean = false): Promise<void> {
        const template = await this.templateRepository.findOne({ where: { id } });
        if (!template) {
            throw new TemplateNotFoundError({ templateName: id });
        }

        if (template.scope === 'system' && !canDeleteSystemTemplate) {
            throw new TemplateForbiddenError('Cannot delete a system template.');
        }

        await this.templateRepository.remove(template);
    }
}

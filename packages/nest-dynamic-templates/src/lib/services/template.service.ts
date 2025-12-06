import { Injectable, ForbiddenException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, Not, In, Equal } from 'typeorm';
import { NestDynamicTemplate } from '../entities/template.entity';
import { TemplateEngineEnum, TemplateLanguageEnum, TemplateTypeEnum } from '../interfaces/template.types';
import { RenderTemplateDto, RenderTemplateOutputDTO } from '../dto/render-template.dto';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { TemplateFilterDto } from '../dto/template-filter.dto';
import { TemplateLayoutService } from './template-layout.service';
import { TemplateEngineRegistryService } from './template-engine.registry';
import { omit } from 'lodash';
import { RenderContentTemplateDto } from '../dto/render-content-template.dto';
import { NestDynamicTemplateLayout } from '../entities/template-layout.entity';
import {
    TemplateRenderError,
    TemplateEngineError,
    TemplateLanguageError,
    TemplateLayoutError,
    TemplateContentError
} from '../errors/template.errors';

@Injectable()
export class TemplateService {
    constructor(
        @InjectRepository(NestDynamicTemplate)
        private readonly templateRepository: Repository<NestDynamicTemplate>,
        private readonly engineRegistry: TemplateEngineRegistryService,
        private readonly templateLayoutService: TemplateLayoutService,
    ) { }

    async render(renderDto: RenderTemplateDto): Promise<RenderTemplateOutputDTO> {
        const { name, scope, scopeId, locale, context } = renderDto;

        try {
            // Find template with fallback
            if (!name) {
                throw new BadRequestException('Template name is required');
            }
            const template = await this.findTemplate(name, scope || 'system', scopeId, locale);
            if (!template) {
                throw new NotFoundException(`Template not found: ${name} in scope ${scope || 'system'}`);
            }

            let content = template.content;
            let subject = template.subject;

            // Render subject by template engine
            if (template.subject && template.engine) {
                try {
                    const subjectEngine = this.engineRegistry.getTemplateEngine(template.engine);
                    subject = await subjectEngine.render(template.subject,  context || {});
                } catch (error) {
                    throw new TemplateEngineError(template.engine, error as Error);
                }
            }

            // Render content by template engine
            if (template.engine) {
                try {
                    content = await this.renderEngine(template.engine, content,  context || {});
                } catch (error) {
                    throw new TemplateEngineError(template.engine, error as Error);
                }
            }

            // If template has layout, apply it
            let layout: any;
            if (template.templateLayoutName) {
                try {
                    layout = await this.templateLayoutService.render({
                        name: template.templateLayoutName,
                        scope: scope || 'system',
                        scopeId,
                        locale,
                        context: {
                            ...(context || {}),
                            content
                        }
                    });
                    content = layout.content;
                } catch (error) {
                    throw new TemplateLayoutError(template.templateLayoutName, error as Error);
                }
            }

            // If template has language format, process with language engine
            if (!layout && template.language) {
                try {
                    content = await this.renderLanguage(template.language, content,  context || {});
                } catch (error) {
                    throw new TemplateLanguageError(template.language, error as Error);
                }
            }

            return {
                subject: subject || '',
                content
            };
        } catch (error) {
            // Re-throw known template errors
            if (error instanceof TemplateEngineError ||
                error instanceof TemplateLanguageError ||
                error instanceof TemplateLayoutError ||
                error instanceof NotFoundException) {
                throw error;
            }

            // Wrap unknown errors
            throw new TemplateRenderError('template rendering', error as Error, name);
        }
    }

    async renderContent(input: RenderContentTemplateDto): Promise<string> {
        const { content, language, engine, context, templateLayoutId } = input;

        try {
            if (!content) {
                throw new BadRequestException('Content is required for rendering');
            }

            let renderContent = content;

            // Step 1: Render template variables first
            try {
                renderContent = await this.renderEngine(engine || TemplateEngineEnum.NUNJUCKS, renderContent,  context || {});
            } catch (error) {
                throw new TemplateEngineError(engine || TemplateEngineEnum.NUNJUCKS, error as Error);
            }

            // Step 2: Handle MJML with layouts intelligently
            let templateLayout: NestDynamicTemplateLayout | null = null;
            if (templateLayoutId) {
                try {
                    templateLayout = await this.templateLayoutService.getTemplateLayoutById(templateLayoutId);
                    if (!templateLayout) {
                        throw new NotFoundException(`Template layout not found with ID: ${templateLayoutId}`);
                    }
                } catch (error) {
                    if (error instanceof NotFoundException) {
                        throw error;
                    }
                    throw new TemplateContentError('template layout retrieval', error as Error);
                }

                if (templateLayout) {
                    try {
                        // Step 3: Render the layout content
                        renderContent = await this.templateLayoutService.renderContent({
                            content: templateLayout.content,
                            language: language,
                            engine: engine,
                        context: {
                            ...(context || {}),
                            content: renderContent
                        }
                        });
                    } catch (error) {
                        throw new TemplateLayoutError(templateLayout.name, error as Error);
                    }
                }
            }

            // Step 4: Render the content with the language engine
            if ((!templateLayoutId || !templateLayout) && language) {
                try {
                    renderContent = await this.renderLanguage(language, renderContent,  context || {});
                } catch (error) {
                    throw new TemplateLanguageError(language, error as Error);
                }
            }

            return renderContent;
        } catch (error) {
            // Re-throw known template errors
            if (error instanceof TemplateEngineError ||
                error instanceof TemplateLanguageError ||
                error instanceof TemplateLayoutError ||
                error instanceof TemplateContentError ||
                error instanceof NotFoundException ||
                error instanceof BadRequestException) {
                throw error;
            }

            // Wrap unknown errors
            throw new TemplateRenderError('content rendering', error as Error);
        }
    }

    async renderLanguage(language: TemplateLanguageEnum, content: string, context: Record<string, any>): Promise<string> {
        try {
            if (!content) {
                throw new BadRequestException('Content is required for language rendering');
            }

            const languageEngine = this.engineRegistry.getLanguageEngine(language);
            if (!languageEngine) {
                throw new BadRequestException(`Language engine not found for: ${language}`);
            }

            return await languageEngine.render(content,  context || {});
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new TemplateLanguageError(language, error as Error);
        }
    }

    async renderEngine(engine: TemplateEngineEnum, content: string, context: Record<string, any>): Promise<string> {
        try {
            if (!content) {
                throw new BadRequestException('Content is required for engine rendering');
            }

            const templateEngine = this.engineRegistry.getTemplateEngine(engine);
            if (!templateEngine) {
                throw new BadRequestException(`Template engine not found for: ${engine}`);
            }

            return await templateEngine.render(content,  context || {});
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new TemplateEngineError(engine, error as Error);
        }
    }

    /**
     * Get all templates, with scoped templates taking precedence over system templates
     */
    async getTemplates(filter: TemplateFilterDto = {}): Promise<NestDynamicTemplate[]> {
        const {
            scope,
            scopeId,
            type,
            locale,
            excludeNames = [],
        } = filter;


        // Build the where clause
        const where: any = {};
        if (type) where.type = type;
        if (locale) where.locale = locale;
        if (excludeNames.length > 0) where.name = Not(In(excludeNames));

        const systemTemplates = await this.templateRepository.find({
            where: {
                ...where,
                scope: 'system',
                scopeId: IsNull(),
            },
        });

        if (scope === 'system') {
            return systemTemplates;
        }

        // First get all templates matching the filters
        const templates = await this.templateRepository.find({
            where: {
                ...where,
                scope: Equal(scope),
                scopeId: scopeId as any,
            },
            order: {
                createdAt: 'DESC',
            },
        });

        // Create a map to store unique templates by name+type
        const templateMap = new Map<string, NestDynamicTemplate>();

        for (const template of systemTemplates) {
            const key = `${template.type}/${template.name}/${template.locale}`;
            templateMap.set(key, template);
        }

        for (const template of templates) {
            const key = `${template.type}/${template.name}/${template.locale}`;
            templateMap.set(key, template);
        }

        // Convert map values back to array
        return Array.from(templateMap.values());
    }

    async getTemplateById(id: string): Promise<NestDynamicTemplate | null> {
        return this.templateRepository.findOne({
            where: { id },
        });
    }

    async findTemplate(
        name: string,
        scope?: string,
        scopeId?: string,
        locale?: string
    ): Promise<NestDynamicTemplate | null> {
        // Try to find template in the following order:
        // 1. Scoped template with locale
        // 2. Scoped template without locale
        // 3. System template with locale
        // 4. System template without locale

        const locales = (locale ? [locale, 'en'] : ['en']).filter(Boolean);

        // First try to find in the specified scope
        for (const currentLocale of locales) {
            const template = await this.templateRepository.findOne({
                where: {
                    name,
                    scope,
                    scopeId: scope === 'system' ? IsNull() : Equal(scopeId),
                    locale: currentLocale,
                }
            });

            if (template) {
                return template;
            }
        }

        // If not found and not already in system scope, try system scope
        if (scope !== 'system') {
            for (const currentLocale of locales) {
                const template = await this.templateRepository.findOne({
                    where: {
                        name,
                        scope: 'system',
                        scopeId: IsNull(),
                        locale: currentLocale,
                    }
                });

                if (template) {
                    return template;
                }
            }
        }

        return null;
    }

    /**
     * Create a system template. Only system templates can be created directly.
     */
    async createTemplate(data: CreateTemplateDto): Promise<NestDynamicTemplate> {
        // Ensure this is a system template
        if (data.scope !== 'system') {
            throw new ForbiddenException('Only system templates can be created directly');
        }

        // Check if template already exists
        const existingTemplate = await this.templateRepository.findOne({
            where: {
                name: data.name,
                scope: 'system',
                scopeId: IsNull(),
                locale: data.locale,
            },
        });

        if (existingTemplate) {
            throw new ConflictException(`System template already exists`);
        }

        const template = this.templateRepository.create({
            ...data,
            scopeId: undefined, // Ensure system templates have no scopeId
        });

        return this.templateRepository.save(template);
    }

    async overwriteSystemTemplate(templateId: string, updates: Partial<CreateTemplateDto>): Promise<NestDynamicTemplate> {
        let template = await this.templateRepository.findOne({
            where: { id: templateId },
        });

        if (!template) {
            throw new NotFoundException(`Template not found: ${templateId}`);
        }

        if (template.scope === 'system') {
            if (!updates.scope) {
                throw new BadRequestException('Scope is required when overwriting system template');
            }

            // Check if template already exists in target scope
            const existingTemplate = await this.templateRepository.findOne({
                where: {
                    name: template.name,
                    locale: template.locale,
                    scope: updates.scope,
                    scopeId: updates.scopeId as any,
                },
            });

            if (existingTemplate) {
                // Update existing template in target scope
                template = existingTemplate;
            } else {
                // Create new template in target scope
                const newTemplate = this.templateRepository.create({
                    ...template,
                    id: undefined,
                    createdAt: undefined,
                    updatedAt: undefined,
                    scope: updates.scope,
                    scopeId: updates.scopeId,
                });
                template = newTemplate;
            }
        }
        updates = omit(updates, ['name', 'id', 'createdAt', 'updatedAt']);

        template = this.templateRepository.merge(template, updates);
        await this.templateRepository.save(template);
        return template;
    }


    /**
     * Update a template
     */
    async updateTemplate(
        id: string,
        updates: Partial<CreateTemplateDto>,
        canUpdateSystemTemplate: boolean = false,
    ): Promise<NestDynamicTemplate> {
        // Find the template
        let template = await this.templateRepository.findOne({
            where: { id },
        });

        if (!template) {
            throw new NotFoundException(`Template not found: ${id}`);
        }

        // If it's a system template and we can't update it, try to overwrite it
        if (template.scope === 'system' && !canUpdateSystemTemplate) {
            if (updates.scope) {
                // Otherwise, allow overwriting to custom scope
                return this.overwriteSystemTemplate(id, updates);
            } else {
                throw new ForbiddenException('Cannot update system templates');
            }
        }

        // For regular updates
        template = this.templateRepository.merge(template, updates);
        return this.templateRepository.save(template);
    }

    /**
     * Delete a scoped template
     */
    async deleteTemplate(id: string, canDeleteSystemTemplate: boolean = false): Promise<void> {
        const template = await this.templateRepository.findOne({
            where: { id },
        });

        if (!template) {
            throw new Error(`Template not found: ${id}`);
        }

        // Prevent deleting system templates
        if (template.scope === 'system' && !canDeleteSystemTemplate) {
            throw new ForbiddenException('Cannot delete system templates');
        }

        await this.templateRepository.remove(template);
    }
}

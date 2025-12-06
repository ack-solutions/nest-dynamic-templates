import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, IsNull, Not, Repository } from 'typeorm';
import { NestDynamicTemplateLayout } from '../entities/template-layout.entity';
import { TemplateEngineEnum, TemplateLanguageEnum, TemplateTypeEnum } from '../interfaces/template.types';
import { TemplateLayoutFilterDto } from '../dto/template-layout-filter.dto';
import { TemplateEngineRegistryService } from './template-engine.registry';
import { RenderTemplateLayoutDto, RenderTemplateLayoutOutput } from '../dto/render-template-layout.dto';
import { CreateTemplateLayoutDto } from '../dto/create-template-layout.dto';
import { RenderContentTemplateLayoutDto } from '../dto/render-content-template-layout.dto';
import {
    TemplateRenderError,
    TemplateEngineError,
    TemplateLanguageError,
} from '../errors/template.errors';

@Injectable()
export class TemplateLayoutService {
    constructor(
        @InjectRepository(NestDynamicTemplateLayout)
        private readonly layoutRepository: Repository<NestDynamicTemplateLayout>,
        private readonly engineRegistry: TemplateEngineRegistryService
    ) { }


    async render(renderDto: RenderTemplateLayoutDto): Promise<RenderTemplateLayoutOutput> {
        const { name, scope, scopeId, locale, context } = renderDto;

        try {
            // Find template with fallback
            const templateLayout = await this.findTemplateLayout(name, scope, scopeId, locale);
            if (!templateLayout) {
                throw new NotFoundException(`Template layout not found: ${name} in scope ${scope || 'system'}`);
            }

            // Validate content exists
            if (!templateLayout.content) {
                throw new BadRequestException(`Template layout '${name}' has no content to render`);
            }

            let content = templateLayout.content;

            // Render content by template engine
            if (templateLayout.engine) {
                try {
                    content = await this.renderEngine(templateLayout.engine, content, context || {});
                } catch (error) {
                    throw new TemplateEngineError(templateLayout.engine, error as Error);
                }
            }

            // If template has language format, process with language engine
            if (templateLayout.language) {
                try {
                    content = await this.renderLanguage(templateLayout.language, content, context || {});
                } catch (error) {
                    throw new TemplateLanguageError(templateLayout.language, error as Error);
                }
            }

            return {
                content
            };
        } catch (error) {
            // Re-throw known template errors
            if (error instanceof TemplateEngineError ||
                error instanceof TemplateLanguageError ||
                error instanceof NotFoundException ||
                error instanceof BadRequestException) {
                throw error;
            }

            // Wrap unknown errors
            throw new TemplateRenderError('template layout rendering', error as Error, name);
        }
    }

    async renderContent(input: RenderContentTemplateLayoutDto): Promise<string> {
        const { content, language, engine, context } = input;

        try {
            if (!content) {
                throw new BadRequestException('Content is required for template layout rendering');
            }

            let renderContent = content;

            // Render content by template engine
            if (engine) {
                try {
                    renderContent = await this.renderEngine(engine, content, context || {});
                } catch (error) {
                    throw new TemplateEngineError(engine, error as Error);
                }
            }

            // Render content by language engine
            if (language) {
                try {
                    renderContent = await this.renderLanguage(language, renderContent, context || {});
                } catch (error) {
                    throw new TemplateLanguageError(language, error as Error);
                }
            }

            return renderContent;
        } catch (error) {
            // Re-throw known template errors
            if (error instanceof TemplateEngineError ||
                error instanceof TemplateLanguageError ||
                error instanceof BadRequestException) {
                throw error;
            }

            // Wrap unknown errors
            throw new TemplateRenderError('template layout content rendering', error as Error);
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

            return await languageEngine.render(content, context);
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

            return await templateEngine.render(content, context);
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
    async getTemplateLayouts(filter: TemplateLayoutFilterDto = {}): Promise<NestDynamicTemplateLayout[]> {
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

        const systemTemplates = await this.layoutRepository.find({
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
        const templates = await this.layoutRepository.find({
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
        const templateMap = new Map<string, NestDynamicTemplateLayout>();

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

    async getTemplateLayoutById(id: string): Promise<NestDynamicTemplateLayout | null> {
        return this.layoutRepository.findOne({
            where: { id },
        });
    }

    async findTemplateLayout(
        name: string,
        scope?: string,
        scopeId?: string,
        locale?: string
    ): Promise<NestDynamicTemplateLayout | null> {
        // Try to find template in the following order:
        // 1. Scoped template with locale
        // 2. Scoped template without locale
        // 3. System template with locale
        // 4. System template without locale

        const locales = (locale ? [locale, 'en'] : ['en']).filter(Boolean);

        // First try to find in the specified scope
        for (const currentLocale of locales) {
            const template = await this.layoutRepository.findOne({
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
                const template = await this.layoutRepository.findOne({
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
    async createTemplateLayout(data: CreateTemplateLayoutDto): Promise<NestDynamicTemplateLayout> {
        // Ensure this is a system template
        if (data.scope !== 'system') {
            throw new ForbiddenException('Only system templates can be created directly');
        }

        // Check if template already exists
        const existingTemplate = await this.layoutRepository.findOne({
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

        const template = this.layoutRepository.create({
            ...data,
            scopeId: undefined, // Ensure system templates have no scopeId
        });

        return this.layoutRepository.save(template);
    }

    async overwriteSystemTemplateLayout(templateId: string, updates: Partial<CreateTemplateLayoutDto>): Promise<NestDynamicTemplateLayout> {
        let template = await this.layoutRepository.findOne({
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
            const existingTemplate = await this.layoutRepository.findOne({
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
                const newTemplate = this.layoutRepository.create({
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

        template = this.layoutRepository.merge(template, updates);
        await this.layoutRepository.save(template);
        return template;
    }


    /**
     * Update a template
     */
    async updateTemplateLayout(
        id: string,
        updates: Partial<CreateTemplateLayoutDto>,
        canUpdateSystemTemplate: boolean = false,
    ): Promise<NestDynamicTemplateLayout> {
        // Find the template
        let template = await this.layoutRepository.findOne({
            where: { id },
        });

        if (!template) {
            throw new NotFoundException(`Template not found: ${id}`);
        }

        // If it's a system template and we can't update it, try to overwrite it
        if (template.scope === 'system' && !canUpdateSystemTemplate) {

            if (updates.scope) {
                // Otherwise, allow overwriting to custom scope
                return this.overwriteSystemTemplateLayout(id, updates);
            } else {
                throw new ForbiddenException('Cannot update system templates');
            }
        }

        // For regular updates
        template = this.layoutRepository.merge(template, updates);
        return this.layoutRepository.save(template);
    }

    /**
     * Delete a scoped template
     */
    async deleteTemplateLayout(id: string, canDeleteSystemTemplate: boolean = false): Promise<void> {
        const template = await this.layoutRepository.findOne({
            where: { id },
        });

        if (!template) {
            throw new Error(`Template not found: ${id}`);
        }

        // Prevent deleting system templates
        if (template.scope === 'system' && !canDeleteSystemTemplate) {
            throw new ForbiddenException('Cannot delete system templates');
        }

        await this.layoutRepository.remove(template);
    }
}

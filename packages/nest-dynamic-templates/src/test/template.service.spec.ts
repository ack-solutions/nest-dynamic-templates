import { DataSource, Repository } from 'typeorm';
import { createTestModule } from './test.setup';
import { TemplateService } from '../lib/services/template.service';
import { NestDynamicTemplate } from '../lib/entities/template.entity';
import { TemplateTypeEnum, TemplateEngineEnum, TemplateLanguageEnum } from '../lib/interfaces/template.types';
import { CreateTemplateDto } from '../lib/dto/create-template.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NestDynamicTemplateLayout } from '../lib/entities/template-layout.entity';
import { TemplateLayoutService } from '../lib/services/template-layout.service';
import { engineFilters } from './helpers';

describe('TemplateService', () => {
    let service: TemplateService;
    let layoutService: TemplateLayoutService;
    let dataSource: DataSource;
    let templateRepository: Repository<NestDynamicTemplate>;
    let templateLayoutRepository: Repository<NestDynamicTemplateLayout>;

    const testTemplate: CreateTemplateDto = {
        name: 'test-template',
        displayName: 'Test Template',
        content: 'Hello {{name}}!',
        type: TemplateTypeEnum.EMAIL,
        engine: TemplateEngineEnum.NUNJUCKS,
        language: TemplateLanguageEnum.HTML,
        scope: 'system',
        scopeId: null,
        locale: 'en',
        isActive: true
    };

    beforeEach(async () => {
        const moduleRef = await createTestModule({
            enginesOptions: {
                filters: engineFilters
            }
        });

        service = moduleRef.get<TemplateService>(TemplateService);
        layoutService = moduleRef.get<TemplateLayoutService>(TemplateLayoutService);
        dataSource = moduleRef.get<DataSource>(DataSource);
        templateRepository = dataSource.getRepository(NestDynamicTemplate);
        templateLayoutRepository = dataSource.getRepository(NestDynamicTemplateLayout);
    });

    afterEach(async () => {
        // Clean up templates
        await templateRepository.delete('1 = 1');

        // Clean up database after each test
        await dataSource.synchronize(true);
    });

    afterAll(async () => {
        // Close the connection after all tests
        await dataSource.destroy();
    });

    describe('System Template Management', () => {
        it('should create system template', async () => {
            const result = await service.createTemplate(testTemplate);

            expect(result).toBeDefined();
            expect(result.name).toBe(testTemplate.name);
            expect(result.scope).toBe('system');
            expect(result.scopeId).toBeNull();

            // Verify template was saved in database
            const savedTemplate = await templateRepository.findOne({ where: { id: result.id } });
            expect(savedTemplate).toBeDefined();
            expect(savedTemplate.name).toBe(testTemplate.name);
        });

        it('should not create other then system template', async () => {
            await expect(service.createTemplate({
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Custom content for {{name}}'
            })).rejects.toThrow(ForbiddenException);
        });

        it('should find system template', async () => {
            // First create a template
            const created = await service.createTemplate(testTemplate);

            // Then find it
            const found = await service.findTemplate(
                testTemplate.name,
                testTemplate.scope,
                testTemplate.scopeId,
            );

            expect(found).toBeDefined();
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(testTemplate.name);
            expect(found.scope).toBe(testTemplate.scope);
        });

        it('should find system template when template not found with given scope', async () => {
            // Create system template
            const created = await service.createTemplate(testTemplate);

            // Then find it with custom scope
            const found = await service.findTemplate(
                testTemplate.name,
                'custom',
                '123',
            );

            // Verify template was found and is the system template
            expect(found).toBeDefined();
            expect(found).not.toBeNull();
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(testTemplate.name);
            expect(found.scope).toBe('system');
            expect(found.scopeId).toBeNull();
        });

        it('should not find template when template not found in any scope and system', async () => {
            // Try to find non-existent template
            const result = await service.findTemplate(
                'non-existent-template',
                'custom',
                '123',
            );

            expect(result).toBeNull();
        });

        it('should not find template when template not found in system scope', async () => {
            // Try to find non-existent template in system scope
            const result = await service.findTemplate(
                'non-existent-template',
                'system',
                null,
            );

            expect(result).toBeNull();
        });

        it('should update system template when canUpdateSystemTemplate is true', async () => {
            // First create a template
            const created = await service.createTemplate(testTemplate);

            // Then update it
            const result = await service.updateTemplate(created.id, {
                content: 'Updated system content for {{name}}'
            }, true);

            expect(result).toBeDefined();
            expect(result.content).toBe('Updated system content for {{name}}');
            expect(result.scope).toBe('system');

            // Verify update in database
            const updatedTemplate = await templateRepository.findOne({ where: { id: created.id } });
            expect(updatedTemplate.content).toBe('Updated system content for {{name}}');
        });

        it('should not update system template when canUpdateSystemTemplate is false, it should throw ForbiddenException', async () => {
            // First create a template
            const created = await service.createTemplate(testTemplate);

            // Then update it with canUpdateSystemTemplate set to false
            await expect(service.updateTemplate(created.id, {
                content: 'Updated system content for {{name}}'
            }, false)).rejects.toThrow(ForbiddenException);


            // Verify template was not updated
            const updatedTemplate = await templateRepository.findOne({ where: { id: created.id } });
            expect(updatedTemplate.content).toBe(testTemplate.content);
        });


        it('should not update system template when canUpdateSystemTemplate is false, but scope is not system then overwrite the template', async () => {
            // First create a template
            const created = await service.createTemplate(testTemplate);

            // Then update it with canUpdateSystemTemplate set to false
            await service.updateTemplate(created.id, {
                scope: 'custom',
                scopeId: '123',
                content: 'Updated system content for {{name}}'
            }, false);


            // Verify system template was not updated
            const updatedTemplate = await templateRepository.findOne({ where: { id: created.id } });
            expect(updatedTemplate.content).toBe(testTemplate.content);

            // Verify overwrite template was created
            const overwrittenTemplate = await service.findTemplate(
                testTemplate.name,
                'custom',
                '123',
            );
            expect(overwrittenTemplate.content).toBe('Updated system content for {{name}}');
        });

        it('should delete system template when canDeleteSystemTemplate is true', async () => {
            // First create a template
            const created = await service.createTemplate(testTemplate);

            // Then delete it
            await service.deleteTemplate(created.id, true);

            // Verify template was deleted
            const deletedTemplate = await templateRepository.findOne({ where: { id: created.id } });
            expect(deletedTemplate).toBeNull();
        });

        it('should not delete system template when canDeleteSystemTemplate is false, it should throw ForbiddenException', async () => {
            // First create a template
            const created = await service.createTemplate(testTemplate);

            // Then delete it
            await expect(service.deleteTemplate(created.id, false)).rejects.toThrow(ForbiddenException);

            // Verify template was not deleted
            const deletedTemplate = await templateRepository.findOne({ where: { id: created.id } });
            expect(deletedTemplate).toBeDefined();
        });
    });

    describe('Render System Template', () => {
        it('should render system template', async () => {
            // Create system template
            await service.createTemplate(testTemplate);

            // Render template
            const renderedResult = await service.render({
                name: testTemplate.name,
                scope: testTemplate.scope,
                scopeId: testTemplate.scopeId,
                context: { name: 'John' }
            });

            // Verify template was rendered correctly
            expect(renderedResult).toEqual({
                subject: null,
                content: 'Hello John!'
            });
        });

        it('should not render system template when not found', async () => {
            // Render template
            await expect(service.render({
                name: testTemplate.name,
                scope: testTemplate.scope,
                scopeId: testTemplate.scopeId,
                context: { name: 'John' }
            })).rejects.toThrow(NotFoundException);
        });

        it('should render system template even scope not system and template not found with given scope', async () => {
            // Create system template
            await service.createTemplate(testTemplate);

            // Render template
            const renderedResult = await service.render({
                name: testTemplate.name,
                scope: 'custom',
                scopeId: '123',
                context: { name: 'John' }
            });

            expect(renderedResult).toEqual({
                subject: null,
                content: 'Hello John!'
            });
        });
    });

    describe('Custom Scope Template Management', () => {
        it('should create overwrite template for custom scope', async () => {
            // Create system template
            const systemTemplate = await service.createTemplate(testTemplate);

            // Then create overwrite template
            const overwriteTemplate = await service.overwriteSystemTemplate(systemTemplate.id, {
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Custom content for {{name}}'
            });

            expect(overwriteTemplate).toBeDefined();
            expect(overwriteTemplate.scope).toBe('custom');
            expect(overwriteTemplate.scopeId).toBe('123');
            expect(overwriteTemplate.content).toBe('Custom content for {{name}}');

            // Verify system template is not affected by overwrite template
            const oldSystemTemplate = await templateRepository.findOne({
                where: { name: testTemplate.name, scope: 'system' }
            });
            expect(oldSystemTemplate).toBeDefined();

            // Verify system template and overwrite template are different
            expect(systemTemplate.id).not.toBe(overwriteTemplate.id);

            // Verify system template content is not affected by overwrite template
            expect(oldSystemTemplate.id).toBe(systemTemplate.id);
            expect(oldSystemTemplate.content).toBe(systemTemplate.content);
        });

        it('should update overwrite template without affecting system template', async () => {
            // Create system template
            const systemTemplate = await service.createTemplate(testTemplate);

            // Create overwrite template
            const overwrite = await service.overwriteSystemTemplate(systemTemplate.id, {
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Custom content for {{name}}'
            });

            // Update overwrite template
            const result = await service.updateTemplate(overwrite.id, {
                content: 'Updated custom content for {{name}}'
            });

            expect(result).toBeDefined();
            expect(result.scope).toBe('custom');
            expect(result.scopeId).toBe('123');
            expect(result.content).toBe('Updated custom content for {{name}}');

            // Verify system template remains unchanged
            const oldSystemTemplate = await templateRepository.findOne({
                where: { name: testTemplate.name, scope: 'system' }
            });
            expect(oldSystemTemplate.content).toBe(systemTemplate.content);
        });

        it('should not overwrite already overwritten template, it should return the already overwritten template but with updated fields', async () => {
            // Create system template
            const systemTemplate = await service.createTemplate(testTemplate);

            // Create overwrite template
            const overwrittenTemplate = await service.overwriteSystemTemplate(systemTemplate.id, {
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Custom content for {{name}}'
            });

            // Try to overwrite again
            const result = await service.overwriteSystemTemplate(systemTemplate.id, {
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Updated custom content for {{name}}'
            })

            // Verify the result is the same as the already overwritten template
            expect(result).toBeDefined();
            expect(result.id).toBe(overwrittenTemplate.id);
            expect(result.content).toBe('Updated custom content for {{name}}');
        });

        it('should find overwrite template when available', async () => {
            // Create system template
            const systemTemplate = await service.createTemplate(testTemplate);

            // Create overwrite template
            await service.overwriteSystemTemplate(systemTemplate.id, {
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Custom content for {{name}}'
            });

            // Find overwrite template
            const found = await service.findTemplate(
                testTemplate.name,
                'custom',
                '123',
                testTemplate.language
            );

            expect(found).toBeDefined();
            expect(found.content).toBe('Custom content for {{name}}');
            expect(found.scope).toBe('custom');
            expect(found.scopeId).toBe('123');
        })

        it('should render overwrite template when available', async () => {
            // Create system template
            const systemTemplate = await service.createTemplate(testTemplate);

            // Create overwrite template
            await service.overwriteSystemTemplate(systemTemplate.id, {
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Custom content for {{name}}'
            });

            const result = await service.render({
                name: testTemplate.name,
                scope: 'custom',
                scopeId: '123',
                locale: testTemplate.language,
                context: { name: 'John' }
            });

            expect(result).toEqual({
                subject: null,
                content: 'Custom content for John'
            });
        });

        it('should not fail render when overwrite not found', async () => {
            // Create only system template
            await service.createTemplate(testTemplate);

            const result = await service.render({
                name: testTemplate.name,
                scope: 'custom',
                scopeId: '123',
                locale: testTemplate.language,
                context: { name: 'John' }
            });

            expect(result).toEqual({
                subject: null,
                content: 'Hello John!'
            });
        });
    });

    describe('Template with Layout', () => {
        it('should render template with layout', async () => {
            // Create layout template
            const layoutTemplate = await layoutService.createTemplateLayout({
                ...testTemplate,
                name: 'test-layout',
                content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>{{ title }}</title>\n</head>\n<body>\n  <header>{{ header }}</header>\n  <main>{{ content }}</main>\n  <footer>{{ footer }}</footer>\n</body>\n</html>'
            });

            // Create content template with layout
            const contentTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'test-content',
                content: 'Hello World',
                templateLayoutName: 'test-layout'
            });

            const result = await service.render({
                name: 'test-content',
                scope: 'system',
                context: {
                    title: 'Test Page',
                    header: 'Welcome',
                    footer: '© 2024'
                }
            });

            expect(result.content).toMatch(/<!DOCTYPE html>/);
            expect(result.content).toMatch(/<title>Test Page<\/title>/);
            expect(result.content).toMatch(/<header>Welcome<\/header>/);
            expect(result.content).toMatch(/<main>Hello World<\/main>/);
            expect(result.content).toMatch(/<footer>© 2024<\/footer>/);
        });

        it('should render template with layout and filters', async () => {
            // Create layout template
            const layoutTemplate = await layoutService.createTemplateLayout({
                ...testTemplate,
                name: 'filter-layout',
                content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>{{ date | formatDate("MMMM D, YYYY") }}</title>\n</head>\n<body>\n  <header>Order {{ orderId }}</header>\n  <main>{{ content }}</main>\n  <footer>Total: {{ amount | formatCurrency("USD") }}</footer>\n</body>\n</html>'
            });

            // Create content template with layout
            const contentTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'filter-content',
                content: 'Order placed on {{ date | formatDate("YYYY-MM-DD") }}',
                templateLayoutName: 'filter-layout'
            });

            const date = new Date('2024-03-15');
            const result = await service.render({
                name: 'filter-content',
                scope: 'system',
                context: {
                    date: date,
                    orderId: '12345',
                    amount: 1234.56
                }
            });

            expect(result.content).toMatch(/<!DOCTYPE html>/);
            expect(result.content).toMatch(/<title>March 15, 2024<\/title>/);
            expect(result.content).toMatch(/<header>Order 12345<\/header>/);
            expect(result.content).toMatch(/<main>Order placed on 2024-03-15<\/main>/);
            expect(result.content).toMatch(/<footer>Total: \$1,234\.56<\/footer>/);
        });

        it('should throw error when layout not found', async () => {
            // Create content template with non-existent layout
            const contentTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'test-content',
                content: 'Hello World',
                templateLayoutName: 'non-existent-layout'
            });

            await expect(service.render({
                name: 'test-content',
                scope: 'system',
                context: {}
            })).rejects.toThrow(NotFoundException);
        });

        it('should handle layout with subject', async () => {
            // Create layout template with subject
            const layoutTemplate = await layoutService.createTemplateLayout({
                ...testTemplate,
                name: 'subject-layout',
                content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>{{ title }}</title>\n</head>\n<body>\n  {{ content }}\n</body>\n</html>'
            });

            // Create content template with layout
            const contentTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'subject-content',
                content: 'Hello World',
                templateLayoutName: 'subject-layout',
                subject: 'Email from {{ sender }}'
            });

            const result = await service.render({
                name: 'subject-content',
                scope: 'system',
                context: {
                    title: 'Test Page',
                    subject: 'Important Message',
                    sender: 'John Doe'
                }
            });

            expect(result.subject).toBe('Email from John Doe');
            expect(result.content).toMatch(/<!DOCTYPE html>/);
            expect(result.content).toMatch(/<title>Test Page<\/title>/);
            expect(result.content).toMatch(/<body>\s*Hello World\s*<\/body>/);
        });
    });

    describe('Template with Multiple Locales', () => {
        it('should render template with correct locale', async () => {
            // Create system template with English content
            const systemTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'locale-template',
                content: 'Hello {{name}}!',
                locale: 'en'
            });

            // Create Spanish template
            const spanishTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'locale-template',
                content: '¡Hola {{name}}!',
                locale: 'es'
            });

            // Create French template
            const frenchTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'locale-template',
                content: 'Bonjour {{name}}!',
                locale: 'fr'
            });

            // Test English rendering
            const englishResult = await service.render({
                name: 'locale-template',
                scope: 'system',
                locale: 'en',
                context: { name: 'John' }
            });
            expect(englishResult.content).toBe('Hello John!');

            // Test Spanish rendering
            const spanishResult = await service.render({
                name: 'locale-template',
                scope: 'system',
                locale: 'es',
                context: { name: 'John' }
            });
            expect(spanishResult.content).toBe('¡Hola John!');

            // Test French rendering
            const frenchResult = await service.render({
                name: 'locale-template',
                scope: 'system',
                locale: 'fr',
                context: { name: 'John' }
            });
            expect(frenchResult.content).toBe('Bonjour John!');
        });

        it('should fallback to system locale when requested locale not found', async () => {
            // Create system template with English content
            const systemTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'fallback-template',
                content: 'Hello {{name}}!',
                locale: 'en'
            });

            // Create Spanish template
            const spanishTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'fallback-template',
                content: '¡Hola {{name}}!',
                locale: 'es'
            });

            // Test with non-existent locale (should fallback to English)
            const result = await service.render({
                name: 'fallback-template',
                scope: 'system',
                locale: 'de', // German locale not defined
                context: { name: 'John' }
            });
            expect(result.content).toBe('Hello John!');
        });

        it('should handle locale-specific overwrites', async () => {
            // Create system template with English content
            const systemTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'locale-overwrite',
                content: 'Hello {{name}}!',
                locale: 'en'
            });

            // Create Spanish template
            const spanishTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'locale-overwrite',
                content: '¡Hola {{name}}!',
                locale: 'es'
            });

            // Create custom scope English template
            const customEnglishTemplate = await service.overwriteSystemTemplate(systemTemplate.id, {
                ...testTemplate,
                name: 'locale-overwrite',
                content: 'Custom Hello {{name}}!',
                locale: 'en',
                scope: 'custom',
                scopeId: '123'
            });

            // Create custom scope Spanish template
            const customSpanishTemplate = await service.overwriteSystemTemplate(spanishTemplate.id, {
                ...testTemplate,
                name: 'locale-overwrite',
                content: 'Custom ¡Hola {{name}}!',
                locale: 'es',
                scope: 'custom',
                scopeId: '123'
            });

            // Test system English
            const systemEnglishResult = await service.render({
                name: 'locale-overwrite',
                scope: 'system',
                locale: 'en',
                context: { name: 'John' }
            });
            expect(systemEnglishResult.content).toBe('Hello John!');

            // Test system Spanish
            const systemSpanishResult = await service.render({
                name: 'locale-overwrite',
                scope: 'system',
                locale: 'es',
                context: { name: 'John' }
            });
            expect(systemSpanishResult.content).toBe('¡Hola John!');

            // Test custom English
            const customEnglishResult = await service.render({
                name: 'locale-overwrite',
                scope: 'custom',
                scopeId: '123',
                locale: 'en',
                context: { name: 'John' }
            });
            expect(customEnglishResult.content).toBe('Custom Hello John!');

            // Test custom Spanish
            const customSpanishResult = await service.render({
                name: 'locale-overwrite',
                scope: 'custom',
                scopeId: '123',
                locale: 'es',
                context: { name: 'John' }
            });
            expect(customSpanishResult.content).toBe('Custom ¡Hola John!');
        });

        it('should handle locale-specific layouts', async () => {
            // Create system layout with English content
            const systemLayout = await layoutService.createTemplateLayout({
                ...testTemplate,
                name: 'locale-layout',
                content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>{{ title }}</title>\n</head>\n<body>\n  <header>{{ header }}</header>\n  <main>{{ content }}</main>\n  <footer>{{ footer }}</footer>\n</body>\n</html>',
                locale: 'en'
            });

            // Create Spanish layout
            const spanishLayout = await layoutService.createTemplateLayout({
                ...testTemplate,
                name: 'locale-layout',
                content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>{{ title }}</title>\n</head>\n<body>\n  <header>{{ header }}</header>\n  <main>{{ content }}</main>\n  <footer>{{ footer }}</footer>\n</body>\n</html>',
                locale: 'es'
            });

            // Create content template
            const contentTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'locale-content',
                content: '{{ message }}',
                templateLayoutName: 'locale-layout'
            });

            // Test English layout
            const englishResult = await service.render({
                name: 'locale-content',
                scope: 'system',
                locale: 'en',
                context: {
                    title: 'Welcome',
                    header: 'Hello',
                    message: 'This is English content',
                    footer: '© 2024'
                }
            });
            expect(englishResult.content).toMatch(/<title>Welcome<\/title>/);
            expect(englishResult.content).toMatch(/<header>Hello<\/header>/);
            expect(englishResult.content).toMatch(/<main>This is English content<\/main>/);
            expect(englishResult.content).toMatch(/<footer>© 2024<\/footer>/);

            // Test Spanish layout
            const spanishResult = await service.render({
                name: 'locale-content',
                scope: 'system',
                locale: 'es',
                context: {
                    title: 'Bienvenido',
                    header: 'Hola',
                    message: 'Este es contenido en español',
                    footer: '© 2024'
                }
            });
            expect(spanishResult.content).toMatch(/<title>Bienvenido<\/title>/);
            expect(spanishResult.content).toMatch(/<header>Hola<\/header>/);
            expect(spanishResult.content).toMatch(/<main>Este es contenido en español<\/main>/);
            expect(spanishResult.content).toMatch(/<footer>© 2024<\/footer>/);
        });
    });

    describe('Template Resolution Order', () => {
        it('should find scoped template with matching locale first', async () => {
            // Create system template
            const systemTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'test-template',
                content: 'System Template',
                locale: 'en'
            });

            // Create scoped template with English locale
            await service.overwriteSystemTemplate(systemTemplate.id, {
                ...testTemplate,
                content: 'Scoped English Template',
                locale: 'en',
                scope: 'custom',
                scopeId: '123'
            });

            const result = await service.findTemplate(
                'test-template',
                'custom',
                '123',
                'en'
            );

            expect(result.content).toBe('Scoped English Template');
        });

        it('should fallback to system template with locale when no scoped template exists', async () => {
            // Create system template with English locale
            const systemTemplate = await service.createTemplate({
                ...testTemplate,
                name: 'test-template',
                content: 'System English Template',
                locale: 'en'
            });

            const result = await service.findTemplate(
                'test-template',
                'custom',
                '123',
                'en'
            );

            expect(result.content).toBe('System English Template');
        });

        it('should follow same resolution order for render function', async () => {
            // Create system template with English locale
            const systemTemplateEn = await service.createTemplate({
                ...testTemplate,
                name: 'test-template',
                content: 'System English Template',
                locale: 'en'
            });

            // Create scoped template with English locale
            await service.overwriteSystemTemplate(systemTemplateEn.id, {
                ...testTemplate,
                name: 'test-template',
                content: 'Scoped English Template',
                locale: 'en',
                scope: 'custom',
                scopeId: '123'
            });

            // Test all resolution steps with render function
            const results = await Promise.all([
                // 1. Scoped template with locale
                service.render({
                    name: 'test-template',
                    scope: 'custom',
                    scopeId: '123',
                    locale: 'en'
                }),

                // 2. System template with locale (after deleting scoped templates)
                (async () => {
                    await templateRepository.delete({ scope: 'custom', scopeId: '123' });
                    return service.render({
                        name: 'test-template',
                        scope: 'custom',
                        scopeId: '123',
                        locale: 'en'
                    });
                })()
            ]);

            expect(results[0].content).toBe('Scoped English Template');
            expect(results[1].content).toBe('System English Template');
        });
    });
});

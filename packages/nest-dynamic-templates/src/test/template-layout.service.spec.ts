import { DataSource, Repository } from 'typeorm';
import { createTestModule } from './test.setup';
import { TemplateTypeEnum, TemplateEngineEnum, TemplateLanguageEnum } from '../lib/interfaces/template.types';
import { CreateTemplateDto } from '../lib/dto/create-template.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NestDynamicTemplateLayout } from '../lib/entities/template-layout.entity';
import { TemplateLayoutService } from '../lib/services/template-layout.service';

describe('Template Layout Service', () => {
    let service: TemplateLayoutService;
    let dataSource: DataSource;
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
        const moduleRef = await createTestModule();

        service = moduleRef.get<TemplateLayoutService>(TemplateLayoutService);
        dataSource = moduleRef.get<DataSource>(DataSource);
        templateLayoutRepository = dataSource.getRepository(NestDynamicTemplateLayout);
    });

    afterEach(async () => {
        // Clean up templates
        await templateLayoutRepository.delete('1 = 1');

        // Clean up database after each test
        await dataSource.synchronize(true);
    });

    afterAll(async () => {
        // Close the connection after all tests
        await dataSource.destroy();
    });

    describe('System Template Layout  Management', () => {
        it('should create system template layout', async () => {
            const result = await service.createTemplateLayout(testTemplate);

            expect(result).toBeDefined();
            expect(result.name).toBe(testTemplate.name);
            expect(result.scope).toBe('system');
            expect(result.scopeId).toBeNull();

            // Verify template was saved in database
            const savedTemplate = await templateLayoutRepository.findOne({ where: { id: result.id } });
            expect(savedTemplate).toBeDefined();
            expect(savedTemplate.name).toBe(testTemplate.name);
        });

        it('should not create other then system template layout', async () => {
            await expect(service.createTemplateLayout({
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Custom content for {{name}}'
            })).rejects.toThrow(ForbiddenException);
        });

        it('should find system template', async () => {
            // First create a template
            const created = await service.createTemplateLayout(testTemplate);

            // Then find it
            const found = await service.findTemplateLayout(
                testTemplate.name,
                testTemplate.scope,
                testTemplate.scopeId,
            );

            expect(found).toBeDefined();
            expect(found.id).toBe(created.id);
            expect(found.name).toBe(testTemplate.name);
            expect(found.scope).toBe(testTemplate.scope);
        });

        it('should find system template layout when template layout not found with given scope', async () => {
            // Create system template layout
            const created = await service.createTemplateLayout(testTemplate);

            // Then find it with custom scope
            const found = await service.findTemplateLayout(
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

        it('should not find template layout when template layout not found in any scope and system', async () => {
            // Try to find non-existent template layout
            const result = await service.findTemplateLayout(
                'non-existent-template',
                'custom',
                '123',
            );

            expect(result).toBeNull();
        });

        it('should not find template layout when template layout not found in system scope', async () => {
            // Try to find non-existent template layout in system scope
            const result = await service.findTemplateLayout(
                'non-existent-template',
                'system',
                null,
            );

            expect(result).toBeNull();
        });

        it('should update system template when canUpdateSystemTemplate is true', async () => {
            // First create a template
            const created = await service.createTemplateLayout(testTemplate);

            // Then update it
            const result = await service.updateTemplateLayout(created.id, {
                content: 'Updated system content for {{name}}'
            }, true);

            expect(result).toBeDefined();
            expect(result.content).toBe('Updated system content for {{name}}');
            expect(result.scope).toBe('system');

            // Verify update in database
            const updatedTemplate = await templateLayoutRepository.findOne({ where: { id: created.id } });
            expect(updatedTemplate.content).toBe('Updated system content for {{name}}');
        });

        it('should not update system template layout when canUpdateSystemTemplate is false, it should throw ForbiddenException', async () => {
            // First create a template layout
            const created = await service.createTemplateLayout(testTemplate);

            // Then update it with canUpdateSystemTemplate set to false
            await expect(service.updateTemplateLayout(created.id, {
                content: 'Updated system content for {{name}}'
            }, false)).rejects.toThrow(ForbiddenException);


            // Verify template was not updated
            const updatedTemplate = await templateLayoutRepository.findOne({ where: { id: created.id } });
            expect(updatedTemplate.content).toBe(testTemplate.content);
        });


        it('should not update system template layout when canUpdateSystemTemplate is false, but scope is not system then overwrite the template layout', async () => {
            // First create a template layout
            const created = await service.createTemplateLayout(testTemplate);

            // Then update it with canUpdateSystemTemplate set to false
            await service.updateTemplateLayout(created.id, {
                scope: 'custom',
                scopeId: '123',
                content: 'Updated system content for {{name}}'
            }, false);


            // Verify system template was not updated
            const updatedTemplate = await templateLayoutRepository.findOne({ where: { id: created.id } });
            expect(updatedTemplate.content).toBe(testTemplate.content);

            // Verify overwrite template was created
            const overwrittenTemplate = await service.findTemplateLayout(
                testTemplate.name,
                'custom',
                '123',
            );
            expect(overwrittenTemplate.content).toBe('Updated system content for {{name}}');
        });

        it('should delete system template layout when canDeleteSystemTemplate is true', async () => {
            // First create a template layout
            const created = await service.createTemplateLayout(testTemplate);

            // Then delete it
            await service.deleteTemplateLayout(created.id, true);

            // Verify template was deleted
            const deletedTemplate = await templateLayoutRepository.findOne({ where: { id: created.id } });
            expect(deletedTemplate).toBeNull();
        });

        it('should not delete system template when canDeleteSystemTemplate is false, it should throw ForbiddenException', async () => {
            // First create a template
            const created = await service.createTemplateLayout(testTemplate);

            // Then delete it
            await expect(service.deleteTemplateLayout(created.id, false)).rejects.toThrow(ForbiddenException);

            // Verify template was not deleted
            const deletedTemplate = await templateLayoutRepository.findOne({ where: { id: created.id } });
            expect(deletedTemplate).toBeDefined();
        });
    });

    describe('Render System Template Layout', () => {
        it('should render system template layout', async () => {
            // Create system template layout
            await service.createTemplateLayout(testTemplate);

            // Render template
            const renderedResult = await service.render({
                name: testTemplate.name,
                scope: testTemplate.scope,
                scopeId: testTemplate.scopeId,
                context: { name: 'John' }
            });

            // Verify template was rendered correctly
            expect(renderedResult).toEqual({
                subject: undefined,
                content: 'Hello John!'
            });
        });

        it('should not render system template layout when not found', async () => {
            // Render template
            await expect(service.render({
                name: testTemplate.name,
                scope: testTemplate.scope,
                scopeId: testTemplate.scopeId,
                context: { name: 'John' }
            })).rejects.toThrow(NotFoundException);
        });

        it('should render system template layout even scope not system and template layout not found with given scope', async () => {
            // Create system template layout
            await service.createTemplateLayout(testTemplate);

            // Render template
            const renderedResult = await service.render({
                name: testTemplate.name,
                scope: 'custom',
                scopeId: '123',
                context: { name: 'John' }
            });

            expect(renderedResult).toEqual({
                subject: undefined,
                content: 'Hello John!'
            });
        });
    });

    describe('Custom Scope Template Layout Management', () => {
        it('should create overwrite template layout for custom scope', async () => {
            // Create system template layout
            const systemTemplateLayout = await service.createTemplateLayout(testTemplate);

            // Then create overwrite template layout
            const overwriteTemplateLayout = await service.overwriteSystemTemplateLayout(systemTemplateLayout.id, {
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Custom content for {{name}}'
            });

            expect(overwriteTemplateLayout).toBeDefined();
            expect(overwriteTemplateLayout.scope).toBe('custom');
            expect(overwriteTemplateLayout.scopeId).toBe('123');
            expect(overwriteTemplateLayout.content).toBe('Custom content for {{name}}');

            // Verify system template is not affected by overwrite template
            const oldSystemTemplate = await templateLayoutRepository.findOne({
                where: { name: testTemplate.name, scope: 'system' }
            });
            expect(oldSystemTemplate).toBeDefined();

            // Verify system template and overwrite template are different
            expect(systemTemplateLayout.id).not.toBe(overwriteTemplateLayout.id);

            // Verify system template content is not affected by overwrite template
            expect(oldSystemTemplate.id).toBe(systemTemplateLayout.id);
            expect(oldSystemTemplate.content).toBe(systemTemplateLayout.content);
        });

        it('should update overwrite template layout without affecting system template layout', async () => {
            // Create system template layout
            const systemTemplateLayout = await service.createTemplateLayout(testTemplate);

            // Create overwrite template layout
            const overwriteTemplateLayout = await service.overwriteSystemTemplateLayout(systemTemplateLayout.id, {
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Custom content for {{name}}'
            });

            // Update overwrite template layout
            const result = await service.updateTemplateLayout(overwriteTemplateLayout.id, {
                content: 'Updated custom content for {{name}}'
            });

            expect(result).toBeDefined();
            expect(result.scope).toBe('custom');
            expect(result.scopeId).toBe('123');
            expect(result.content).toBe('Updated custom content for {{name}}');

            // Verify system template remains unchanged
            const oldSystemTemplate = await templateLayoutRepository.findOne({
                where: { name: testTemplate.name, scope: 'system' }
            });
            expect(oldSystemTemplate.content).toBe(systemTemplateLayout.content);
        });

        it('should not overwrite already overwritten template layout, it should return the already overwritten template layout but with updated fields', async () => {
            // Create system template layout
            const systemTemplateLayout = await service.createTemplateLayout(testTemplate);

            // Create overwrite template layout
            const overwrittenTemplateLayout = await service.overwriteSystemTemplateLayout(systemTemplateLayout.id, {
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Custom content for {{name}}'
            });

            // Try to overwrite again
            const result = await service.overwriteSystemTemplateLayout(systemTemplateLayout.id, {
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Updated custom content for {{name}}'
            })

            // Verify the result is the same as the already overwritten template
            expect(result).toBeDefined();
            expect(result.id).toBe(overwrittenTemplateLayout.id);
            expect(result.content).toBe('Updated custom content for {{name}}');
        });

        it('should find overwrite template when available', async () => {
            // Create system template layout
            const systemTemplateLayout = await service.createTemplateLayout(testTemplate);

            // Create overwrite template layout
            await service.overwriteSystemTemplateLayout(systemTemplateLayout.id, {
                ...testTemplate,
                scope: 'custom',
                scopeId: '123',
                content: 'Custom content for {{name}}'
            });

            // Find overwrite template layout
            const found = await service.findTemplateLayout(
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
            // Create system template layout
            const systemTemplateLayout = await service.createTemplateLayout(testTemplate);

            // Create overwrite template layout
            await service.overwriteSystemTemplateLayout(systemTemplateLayout.id, {
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
                subject: undefined,
                content: 'Custom content for John'
            });
        });

        it('should not fail render when overwrite template layout not found', async () => {
            // Create only system template layout
            await service.createTemplateLayout(testTemplate);

            const result = await service.render({
                name: testTemplate.name,
                scope: 'custom',
                scopeId: '123',
                locale: testTemplate.language,
                context: { name: 'John' }
            });

            expect(result).toEqual({
                subject: undefined,
                content: 'Hello John!'
            });
        });
    });

});

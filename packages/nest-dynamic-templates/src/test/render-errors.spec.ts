import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { createTestModule } from './test.setup';
import { TemplateService } from '../lib/services/template.service';
import { NestDynamicTemplate } from '../lib/entities/template.entity';
import { TemplateEngineEnum, TemplateLanguageEnum, TemplateTypeEnum } from '../lib/interfaces/template.types';
import { CreateTemplateDto } from '../lib/dto/create-template.dto';
import {
    TemplateEngineUnavailableError,
    TemplateErrorCode,
    TemplateNotFoundError,
    TemplateRenderError,
    isTemplateError,
} from '../lib/errors/template.errors';

const base: CreateTemplateDto = {
    name: 'err-template',
    displayName: 'Err Template',
    content: 'Hello {{ firstName }}!',
    type: TemplateTypeEnum.EMAIL,
    engine: TemplateEngineEnum.NUNJUCKS,
    language: TemplateLanguageEnum.HTML,
    scope: 'system',
    scopeId: null,
    locale: 'en',
    isActive: true,
};

describe('Rich render errors', () => {
    let service: TemplateService;
    let dataSource: DataSource;
    let repo: Repository<NestDynamicTemplate>;

    beforeEach(async () => {
        const moduleRef = await createTestModule({
            engines: { template: [TemplateEngineEnum.NUNJUCKS], language: [TemplateLanguageEnum.HTML, TemplateLanguageEnum.MJML] },
        });
        service = moduleRef.get(TemplateService);
        dataSource = moduleRef.get(DataSource);
        repo = dataSource.getRepository(NestDynamicTemplate);
    });

    afterEach(async () => {
        await repo.delete('1 = 1');
        await dataSource.synchronize(true);
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it('names the missing variable and lists the context keys actually provided', async () => {
        await service.createTemplate(base);

        expect.assertions(9);
        try {
            await service.render({ name: 'err-template', scope: 'system', context: { email: 'a@b.com' } });
        } catch (e) {
            const err = e as TemplateRenderError;
            expect(isTemplateError(err)).toBe(true);
            expect(err.code).toBe(TemplateErrorCode.RENDER_FAILED);
            expect(err.getStatus()).toBe(422);
            expect(err.details.missingVariable).toBe('firstName');
            expect(err.details.contextKeys).toEqual(['email']);
            expect(err.details.stage).toBe('template-engine');
            expect(err.details.engine).toBe('njk');
            expect(err.details.snippet).toContain('{{ firstName }}');
            expect(err.message).toContain('variable "firstName" is undefined');
        }
    });

    it('reports the source line for a multi-line template', async () => {
        await service.createTemplate({
            ...base,
            name: 'multi-line',
            content: '<h1>Welcome</h1>\n<p>Order {{ orderId }}</p>',
        });

        try {
            await service.render({ name: 'multi-line', scope: 'system', context: {} });
            fail('expected render to throw');
        } catch (e) {
            const err = e as TemplateRenderError;
            expect(err.details.missingVariable).toBe('orderId');
            expect(err.details.location?.line).toBe(2);
            expect(err.details.snippet).toBe('<p>Order {{ orderId }}</p>');
        }
    });

    it('throws TemplateNotFoundError (a 404) for an unknown template', async () => {
        const promise = service.render({ name: 'does-not-exist', scope: 'system', context: {} });
        await expect(promise).rejects.toBeInstanceOf(TemplateNotFoundError);
        await expect(promise).rejects.toBeInstanceOf(NotFoundException); // back-compat
    });

    it('throws TemplateEngineUnavailableError when a template uses a disabled engine', async () => {
        // Engine is stored as Handlebars but only Nunjucks is enabled in this module.
        await service.createTemplate({ ...base, name: 'hbs-tpl', engine: TemplateEngineEnum.HANDLEBARS });

        try {
            await service.render({ name: 'hbs-tpl', scope: 'system', context: { firstName: 'Jo' } });
            fail('expected render to throw');
        } catch (e) {
            const err = e as TemplateEngineUnavailableError;
            expect(err.code).toBe(TemplateErrorCode.ENGINE_UNAVAILABLE);
            expect(err.getStatus()).toBe(500);
            expect(err.message).toContain('"hbs" is not enabled');
            expect(err.details.hint).toContain('engines.template');
        }
    });

    it('surfaces a readable MJML validation message (not [object Object])', async () => {
        await service.createTemplate({
            ...base,
            name: 'bad-mjml',
            language: TemplateLanguageEnum.MJML,
            // mj-text directly under mj-body is invalid MJML.
            content: '<mjml><mj-body><mj-text>Hi {{ firstName }}</mj-text></mj-body></mjml>',
        });

        try {
            await service.render({ name: 'bad-mjml', scope: 'system', context: { firstName: 'Jo' } });
            fail('expected render to throw');
        } catch (e) {
            const err = e as TemplateRenderError;
            expect(err.details.stage).toBe('language-engine');
            expect(err.details.language).toBe('mjml');
            expect(err.message).not.toContain('[object Object]');
            expect(err.message.toLowerCase()).toContain('mj-text');
        }
    });
});

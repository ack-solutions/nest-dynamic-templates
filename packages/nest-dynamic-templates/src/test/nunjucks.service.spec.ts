import { DataSource, Repository } from 'typeorm';
import { createTestModule } from './test.setup';
import { TemplateService } from '../lib/services/template.service';
import { NestDynamicTemplate } from '../lib/entities/template.entity';
import { TemplateTypeEnum, TemplateEngineEnum, TemplateLanguageEnum } from '../lib/interfaces/template.types';
import { CreateTemplateDto } from '../lib/dto/create-template.dto';
import { engineFilters } from './helpers';

describe('Nunjucks Engine', () => {
    let service: TemplateService;
    let dataSource: DataSource;
    let templateRepository: Repository<NestDynamicTemplate>;

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
        dataSource = moduleRef.get<DataSource>(DataSource);
        templateRepository = dataSource.getRepository(NestDynamicTemplate);
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

    describe('Nunjucks Custom Filters', () => {
        it('should format date using custom date filter', async () => {
            // Create template with date filter
            const template = await service.createTemplate({
                ...testTemplate,
                name: 'date-template',
                content: 'Today is {{ date | formatDate("YYYY-MM-DD") }}',
            });

            const today = new Date();
            const expectedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

            const result = await service.render({
                name: 'date-template',
                scope: 'system',
                context: {
                    date: today
                }
            });

            expect(result.content).toBe(`Today is ${expectedDate}`);
        });

        it('should format currency using custom currency filter', async () => {
            // Create template with currency filter
            const template = await service.createTemplate({
                ...testTemplate,
                name: 'currency-template',
                content: 'Price: {{ amount | formatCurrency("USD") }}',
            });

            const result = await service.render({
                name: 'currency-template',
                scope: 'system',
                context: {
                    amount: 1234.56
                }
            });

            expect(result.content).toBe('Price: $1,234.56');
        });

        it('should handle multiple filters in the same template', async () => {
            // Create template with multiple filters
            const template = await service.createTemplate({
                ...testTemplate,
                name: 'multi-filter-template',
                content: 'Order placed on {{ date | formatDate("YYYY-MM-DD") }} for {{ amount | formatCurrency("USD") }}',
            });

            const today = new Date();
            const expectedDate = today.toISOString().split('T')[0];

            const result = await service.render({
                name: 'multi-filter-template',
                scope: 'system',
                context: {
                    date: today,
                    amount: 1234.56
                }
            });

            expect(result.content).toBe(`Order placed on ${expectedDate} for $1,234.56`);
        });

        it('should handle different currency formats', async () => {
            // Create template with different currency formats
            const template = await service.createTemplate({
                ...testTemplate,
                name: 'currency-formats-template',
                content: 'USD: {{ usd | formatCurrency("USD") }}, EUR: {{ eur | formatCurrency("EUR") }}',
            });

            const result = await service.render({
                name: 'currency-formats-template',
                scope: 'system',
                context: {
                    usd: 1234.56,
                    eur: 1234.56,
                }
            });

            expect(result.content).toBe('USD: $1,234.56, EUR: €1,234.56');
        });

        it('should handle different date formats', async () => {
            // Create template with different date formats
            const template = await service.createTemplate({
                ...testTemplate,
                name: 'date-formats-template',
                content: 'Short: {{ date | formatDate("MM/DD/YY") }}, Long: {{ date | formatDate("MMMM D, YYYY") }}, ISO: {{ date | formatDate("YYYY-MM-DD") }}',
            });

            const date = new Date('2024-03-15');
            const result = await service.render({
                name: 'date-formats-template',
                scope: 'system',
                context: {
                    date: date
                }
            });

            expect(result.content).toBe('Short: 03/15/24, Long: March 15, 2024, ISO: 2024-03-15');
        });
    });
});

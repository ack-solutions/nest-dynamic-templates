import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDatabaseConfig } from './test-database.config';
import { NestDynamicTemplateLayout } from '../lib/entities/template-layout.entity';
import { NestDynamicTemplate } from '../lib/entities/template.entity';
import { ValidationPipe } from '@nestjs/common';
import { NestDynamicTemplatesModuleConfig } from '../lib/interfaces/module-config.interface';
import { NestDynamicTemplatesModule } from '../lib/nest-dynamic-templates.module';

export async function createTestModule(options: Partial<NestDynamicTemplatesModuleConfig> = {}) {

    const moduleRef = await Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot(testDatabaseConfig),
            TypeOrmModule.forFeature([NestDynamicTemplate, NestDynamicTemplateLayout]),
            // RedisModule.forRoot(testRedisConfig),
            NestDynamicTemplatesModule.forRoot(options),
        ],
    }).compile();

    return moduleRef;
}

export async function createTestApp(options: Partial<NestDynamicTemplatesModuleConfig> = {}) {

    const moduleRef = await createTestModule(options);
    const app = moduleRef.createNestApplication();

    // Enable validation
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
    return app;
}

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { NestDynamicTemplate } from '../lib/entities/template.entity';
import { NestDynamicTemplateLayout } from '../lib/entities/template-layout.entity';

export const testDatabaseConfig: TypeOrmModuleOptions = {
    type: 'sqlite',
    database: ':memory:',
    entities: [NestDynamicTemplate, NestDynamicTemplateLayout],
    logging: ['error', 'warn'],
    synchronize: true, // Disable auto-synchronization
    dropSchema: true, // Drop schema before tests
};

export const testRedisConfig: RedisModuleOptions = {
    type: 'single',
    options: {
        host: 'localhost',
        port: 6379,
        retryStrategy: (times: number) => {
            return Math.min(times * 50, 2000);
        },
    },
};

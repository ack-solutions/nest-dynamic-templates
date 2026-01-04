import { NestDynamicTemplateLayout } from './lib/entities/template-layout.entity';
import { NestDynamicTemplate } from './lib/entities/template.entity';

export * from './lib/nest-dynamic-templates.module';

// Services
export * from './lib/services/template.service';
export * from './lib/services/template-layout.service';
export * from './lib/services/template-config.service';
export * from './lib/services/template-engine.registry';

// Interfaces
export * from './lib/interfaces/module-config.interface';
export * from './lib/interfaces/template.types';

// Entities
export * from './lib/entities/template.entity';
export * from './lib/entities/template-layout.entity';

// Errors
export * from './lib/errors/template.errors';

// Constants
export * from './lib/constant';

// Engines (for custom engine implementation)
export * from './lib/engines/template-engine';
export * from './lib/engines/language-engine';

// DTOs
export * from './lib/dto/create-template.dto';
export * from './lib/dto/render-template.dto';
export * from './lib/dto/render-content-template.dto';
export * from './lib/dto/template-filter.dto';
export * from './lib/dto/create-template-layout.dto';
export * from './lib/dto/render-template-layout.dto';
export * from './lib/dto/render-content-template-layout.dto';
export * from './lib/dto/template-layout-filter.dto';


export const NestDynamicTemplatesEntities = [
    NestDynamicTemplate,
    NestDynamicTemplateLayout,
];

import { IsString, IsObject, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Render a stored template by name. To render a raw string instead, use
 * `TemplateService.renderContent()` with {@link RenderContentTemplateDto}.
 */
export class RenderTemplateDto {
    @ApiProperty({ type: String, description: 'Name of the stored template to render.' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        type: String,
        default: 'system',
        description:
            'Who owns the version to resolve: "system" (default) or a custom owner kind like "tenant"/"user". Falls back to "system" if no override exists.',
    })
    @IsString()
    @IsOptional()
    scope?: string = 'system';

    @ApiPropertyOptional({
        type: String,
        description: 'Which owner inside the scope (e.g. the tenant/user id).',
    })
    @IsString()
    @IsOptional()
    scopeId?: string;

    @ApiPropertyOptional({
        type: String,
        default: 'en',
        description: 'Locale code, e.g. en, fr, es. Falls back to "en".',
    })
    @IsString()
    @IsOptional()
    locale?: string = 'en';

    @ApiPropertyOptional({
        type: Object,
        description: 'Data passed to the template (the render context).',
    })
    @IsObject()
    @IsOptional()
    context?: Record<string, any>;
}

export class RenderTemplateOutputDTO {
    @ApiProperty({ type: String })
    @IsString()
    content: string;

    @ApiProperty({ type: String, nullable: true, description: 'Rendered subject, or null if the template has none.' })
    @IsOptional()
    @IsString()
    subject: string | null;
}

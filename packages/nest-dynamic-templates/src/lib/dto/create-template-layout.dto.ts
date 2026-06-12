import { IsString, IsEnum, IsOptional, IsNotEmpty, Matches } from 'class-validator';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateTemplateLayoutDto {

    @ApiProperty({
        type: String,
        example: 'email-shell',
        description: 'Stable identifier you reference by (lowercase letters, numbers, "-" and "_").',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z0-9\-_]+$/, { message: 'Invalid template name format' })
    name: string;

    @ApiProperty({ type: String, description: 'Free category for grouping/filtering.' })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ type: String, description: 'Human-friendly label for admin UIs.' })
    @IsString()
    @IsNotEmpty()
    displayName: string;

    @ApiProperty({ type: String, nullable: true, description: 'Free-text notes about what this layout is for.' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        enum: TemplateEngineEnum,
        type: String,
        description: 'Template engine that interpolates variables: njk (Nunjucks), hbs, ejs, pug.',
    })
    @IsEnum(TemplateEngineEnum)
    @IsOptional()
    engine: TemplateEngineEnum = TemplateEngineEnum.NUNJUCKS;

    @ApiProperty({
        enum: TemplateLanguageEnum,
        type: String,
        description: 'Output processor applied after interpolation: html, mjml, md, txt.',
    })
    @IsEnum(TemplateLanguageEnum)
    @IsNotEmpty()
    language: TemplateLanguageEnum;

    @ApiProperty({
        type: String,
        nullable: true,
        example: '<html><body>{{ content }}</body></html>',
        description: 'The layout body. Use {{ content }} where the wrapped template should be injected.',
    })
    @IsString()
    content: string;

    @ApiPropertyOptional({
        type: String,
        default: 'system',
        description:
            'Who owns this version: "system" (shared default) or a custom owner kind like "tenant"/"user".',
    })
    @IsString()
    @IsOptional()
    scope: string = 'system';

    @ApiPropertyOptional({
        type: String,
        description: 'Which owner inside the scope (e.g. the tenant id). Leave empty for system layouts.',
    })
    @IsString()
    @IsOptional()
    scopeId?: string;

    @ApiPropertyOptional({
        type: String,
        nullable: true,
        default: 'en',
        description: 'Language variant, e.g. en, fr, es. Missing locales fall back to "en".',
    })
    @IsString()
    @IsOptional()
    locale?: string = 'en';

    @ApiPropertyOptional({
        type: Object,
        nullable: true,
        description: 'Sample data used to preview the layout (not applied during render).',
    })
    @IsOptional()
    previewContext?: Record<string, any>;

    @ApiPropertyOptional({
        type: Boolean,
        nullable: true,
        description: 'Set false to disable without deleting.',
    })
    @IsOptional()
    isActive?: boolean = true;
}

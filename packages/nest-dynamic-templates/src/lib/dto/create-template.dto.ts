import { IsString, IsEnum, IsOptional, IsNotEmpty, Matches, IsBoolean } from 'class-validator';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTemplateDto {

    @ApiProperty({
        type: String,
        example: 'welcome-email',
        description:
            'Stable identifier you render by (lowercase letters, numbers, "-" and "_"). Stays the same across scopes and locales.',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z0-9\-_]+$/, { message: 'Invalid template name format' })
    name: string;

    @ApiPropertyOptional({ type: String, nullable: true, description: 'Name of a layout to wrap this content in.' })
    @IsString()
    @IsOptional()
    templateLayoutName?: string;

    @ApiProperty({
        type: String,
        example: 'email',
        description: 'Free category for grouping/filtering, e.g. email, sms, push, pdf.',
    })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ type: String, description: 'Human-friendly label for admin UIs, e.g. "Welcome email".' })
    @IsString()
    @IsNotEmpty()
    displayName: string;

    @ApiProperty({ type: String, nullable: true, description: 'Free-text notes about what this template is for.' })
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
    language: TemplateLanguageEnum;

    @ApiProperty({
        type: String,
        nullable: true,
        example: '<h1>Hello {{ firstName }}</h1>',
        description: "The template body, written in the chosen engine's syntax.",
    })
    @IsString()
    @IsOptional()
    content: string;

    @ApiPropertyOptional({
        type: String,
        nullable: true,
        description: 'Optional subject line (emails). Rendered with the engine, so it can use variables.',
    })
    @IsString()
    @IsOptional()
    subject?: string;

    @ApiPropertyOptional({
        type: String,
        default: 'system',
        description:
            'Who owns this version: "system" (shared default) or a custom owner kind like "tenant"/"user". Note: createTemplate only creates system templates.',
    })
    @IsString()
    @IsOptional()
    @Transform(({ value }) => value || 'system')
    scope: string = 'system';

    @ApiPropertyOptional({
        type: String,
        description: 'Which owner inside the scope (e.g. the tenant id). Leave empty for system templates.',
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
    @IsNotEmpty()
    @Transform(({ value }) => value || 'en')
    locale?: string = 'en';

    @ApiPropertyOptional({
        type: Object,
        nullable: true,
        description: 'Sample data used to preview the template (not applied during render).',
    })
    @IsOptional()
    previewContext?: Record<string, any>;

    @ApiPropertyOptional({
        type: Boolean,
        nullable: true,
        description: 'Set false to disable without deleting; inactive templates are skipped during resolution.',
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;

}

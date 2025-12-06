import { IsString, IsEnum, IsOptional, IsNotEmpty, Matches, IsBoolean } from 'class-validator';
import { TemplateEngineEnum, TemplateLanguageEnum, TemplateTypeEnum } from '../interfaces/template.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTemplateDto {

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z0-9\-_]+$/, { message: 'Invalid template name format' })
    name: string;

    @ApiPropertyOptional({ type: String, nullable: true })
    @IsString()
    @IsOptional()
    templateLayoutName?: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ type: String })
    @IsString()
    @IsNotEmpty()
    displayName: string;

    @ApiProperty({ type: String, nullable: true })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ enum: TemplateEngineEnum, type: String })
    @IsEnum(TemplateEngineEnum)
    @IsOptional()
    engine: TemplateEngineEnum = TemplateEngineEnum.NUNJUCKS;

    @ApiProperty({ enum: TemplateLanguageEnum, type: String })
    @IsEnum(TemplateLanguageEnum)
    language: TemplateLanguageEnum;

    @ApiProperty({ type: String, nullable: true })
    @IsString()
    @IsOptional()
    content: string;

    @ApiPropertyOptional({ type: String, nullable: true })
    @IsString()
    @IsOptional()
    subject?: string;

    @ApiPropertyOptional({ type: String, default: 'system' })
    @IsString()
    @IsOptional()
    @Transform(({ value }) => value || 'system')
    scope: string = 'system';

    @ApiPropertyOptional({ type: String })
    @IsString()
    @IsOptional()
    scopeId?: string;

    @ApiPropertyOptional({ type: String, nullable: true, default: 'en' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    @Transform(({ value }) => value || 'en')
    locale?: string = 'en';

    @ApiPropertyOptional({ type: Object, nullable: true })
    @IsOptional()
    previewContext?: Record<string, any>;

    @ApiPropertyOptional({ type: Boolean, nullable: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;

}

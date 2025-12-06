import { IsString, IsEnum, IsOptional, IsNotEmpty, Matches } from 'class-validator';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateTemplateLayoutDto {

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z0-9\-_]+$/, { message: 'Invalid template name format' })
    name: string;

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
    @IsNotEmpty()
    language: TemplateLanguageEnum;

    @ApiProperty({ type: String, nullable: true })
    @IsString()
    content: string;

    @ApiPropertyOptional({ type: String, default: 'system' })
    @IsString()
    @IsOptional()
    scope: string = 'system';

    @ApiPropertyOptional({ type: String })
    @IsString()
    @IsOptional()
    scopeId?: string;

    @ApiPropertyOptional({ type: String, nullable: true, default: 'en' })
    @IsString()
    @IsOptional()
    locale?: string = 'en';

    @ApiPropertyOptional({ type: Object, nullable: true })
    @IsOptional()
    previewContext?: Record<string, any>;

    @ApiPropertyOptional({ type: Boolean, nullable: true })
    @IsOptional()
    isActive?: boolean = true;
}

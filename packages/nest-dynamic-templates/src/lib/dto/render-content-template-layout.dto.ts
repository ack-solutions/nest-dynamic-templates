import { IsString, IsEnum, IsObject, IsOptional, IsNotEmpty } from 'class-validator';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';


export class RenderContentTemplateLayoutDto {
    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    content?: string;

    @ApiProperty({ enum: TemplateLanguageEnum, type: String })
    @IsEnum(TemplateLanguageEnum)
    @IsNotEmpty()
    @Transform(({ value }) => value || TemplateLanguageEnum.HTML)
    language?: TemplateLanguageEnum;

    @ApiProperty({ enum: TemplateEngineEnum, type: String })
    @IsEnum(TemplateEngineEnum)
    @Transform(({ value }) => value || TemplateEngineEnum.NUNJUCKS)
    engine?: TemplateEngineEnum;

    @ApiPropertyOptional({
        type: String,
        nullable: true,
        description: 'The context of the template'
    })
    @IsObject()
    @IsOptional()
    context?: Record<string, any>;
}

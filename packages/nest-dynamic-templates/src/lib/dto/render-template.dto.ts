import { IsString, IsEnum, IsObject, IsOptional, IsNotEmpty, Matches, ValidateIf } from 'class-validator';
import { TemplateLanguageEnum, TemplateTypeEnum } from '../interfaces/template.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class RenderTemplateDto {

    @ApiPropertyOptional({
        type: String,
        default: 'en',
        description: 'The locale code, i.e en, fr, es, etc.'
    })
    @IsString()
    @IsOptional()
    locale?: string = 'en';

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    @ValidateIf((object, value) => !object?.content)
    name?: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    @ValidateIf((object, value) => !object?.name)
    content?: string;

    @ApiProperty({ enum: TemplateLanguageEnum, type: String })
    @IsEnum(TemplateLanguageEnum)
    @IsNotEmpty()
    @ValidateIf((object, value) => !object?.name)
    language?: TemplateLanguageEnum;

    @ApiPropertyOptional({
        type: String,
        default: 'system',
        description: 'The scope of the template, i.e user, organization, etc.'
    })
    @IsString()
    @IsOptional()
    scope?: string = 'system';

    @ApiPropertyOptional({
        type: String,
        default: null,
        description: 'The scope id of the template, i.e user id, organization id, etc.'
    })
    @IsString()
    @IsOptional()
    scopeId?: string;

    @ApiPropertyOptional({
        type: String,
        nullable: true,
        description: 'The context of the template'
    })
    @IsObject()
    @IsOptional()
    context?: Record<string, any>;
}


export class RenderTemplateOutputDTO {
    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    subject: string;
}

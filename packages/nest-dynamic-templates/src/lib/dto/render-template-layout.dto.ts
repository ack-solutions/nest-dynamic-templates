import { IsString, IsEnum, IsObject, IsOptional, IsNotEmpty } from 'class-validator';
import { TemplateTypeEnum } from '../interfaces/template.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class RenderTemplateLayoutDto {

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
    name: string;

    @ApiProperty({
        type: String,
        default: 'system',
        description: 'The scope of the template, i.e user, organization, etc.'
    })
    @IsString()
    scope: string;

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


export class RenderTemplateLayoutOutput {
    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    content: string;
}

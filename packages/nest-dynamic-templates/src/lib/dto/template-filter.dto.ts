import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TemplateTypeEnum } from '../interfaces/template.types';

export class TemplateFilterDto {
    @ApiProperty({
        type: String,
        required: false,
        description: 'Filter by scope (e.g., system, tenant, organization)'
    })
    @IsString()
    @IsOptional()
    scope?: string;

    @ApiProperty({
        type: String,
        required: false,
        description: 'Filter by scope ID (e.g., tenant ID, organization ID)'
    })
    @IsString()
    @IsOptional()
    scopeId?: string;

    @ApiProperty({
        enum: TemplateTypeEnum,
        required: false,
        description: 'Filter by template type'
    })
    @IsEnum(TemplateTypeEnum)
    @IsOptional()
    type?: TemplateTypeEnum;

    @ApiProperty({
        type: String,
        required: false,
        description: 'Filter by locale (e.g., en, fr, es)'
    })
    @IsString()
    @IsOptional()
    locale?: string;

    @ApiProperty({
        type: [String],
        required: false,
        description: 'Exclude templates with these names'
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    excludeNames?: string[];

}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BaseEntity } from 'typeorm';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import { ApiProperty } from '@nestjs/swagger';


@Entity('nest_dynamic_template_layouts')
@Index(['name', 'scope', 'scopeId', 'locale'], { unique: true })
export class NestDynamicTemplateLayout extends BaseEntity {

    @ApiProperty({ type: String, format: 'uuid', readOnly: true, description: 'Primary key.' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        type: String,
        example: 'email-shell',
        description: 'Stable identifier you reference by (lowercase letters, numbers, "-" and "_").',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z0-9\-_]+$/, { message: 'Invalid template name format' })
    @Column()
    name: string;

    @ApiProperty({ type: String, nullable: true, description: 'Human-friendly label for admin UIs.' })
    @IsString()
    @IsOptional()
    @Column({ nullable: true })
    displayName?: string;

    @ApiProperty({ type: String, nullable: true, description: 'Free-text notes about what this layout is for.' })
    @IsString()
    @IsOptional()
    @Column({ type: 'text', nullable: true })
    description?: string;

    @ApiProperty({ type: String, nullable: true, description: 'Free category for grouping/filtering.' })
    @IsString()
    @IsOptional()
    @Column({ type: 'text' })
    type?: string;

    @ApiProperty({
        enum: TemplateEngineEnum,
        type: String,
        description: 'Template engine that interpolates variables: njk (Nunjucks), hbs, ejs, pug.',
    })
    @IsEnum(TemplateEngineEnum)
    @Column({
        type: 'text',
        enum: TemplateEngineEnum,
        default: TemplateEngineEnum.NUNJUCKS
    })
    engine: TemplateEngineEnum;

    @ApiProperty({
        enum: TemplateLanguageEnum,
        type: String,
        nullable: true,
        description: 'Output processor applied after interpolation: html, mjml, md, txt.',
    })
    @IsEnum(TemplateLanguageEnum)
    @IsOptional()
    @Column({ type: 'text' })
    language?: TemplateLanguageEnum;

    @ApiProperty({
        type: String,
        description: 'The layout body. Use {{ content }} where the wrapped template should be injected.',
    })
    @IsString()
    @IsOptional()
    @Column('text')
    content: string;

    @ApiProperty({ type: String, nullable: true, description: 'Name of another layout to nest this one in.' })
    @IsString()
    @IsOptional()
    @Column({ nullable: true })
    templateLayoutName?: string;

    @ApiProperty({
        type: String,
        nullable: true,
        default: 'system',
        description:
            'Who owns this version: "system" (shared default) or a custom owner kind like "tenant"/"user". Overrides fall back to the system layout.',
    })
    @IsString()
    @Column({ nullable: true, default: 'system' })
    scope?: string;

    @ApiProperty({
        type: String,
        nullable: true,
        description: 'Which owner inside the scope (e.g. the tenant id). Leave empty for system layouts.',
    })
    @IsString()
    @Column({ nullable: true })
    scopeId?: string;

    @ApiProperty({
        type: String,
        nullable: true,
        default: 'en',
        description: 'Language variant, e.g. en, fr, es. Missing locales fall back to "en".',
    })
    @IsString()
    @Column({ nullable: true, default: 'en' })
    locale?: string;

    @ApiProperty({
        type: Object,
        nullable: true,
        description: 'Sample data used to preview the layout (not applied during render).',
    })
    @IsOptional()
    @Column('simple-json', { nullable: true })
    previewContext?: Record<string, any>;

    @ApiProperty({
        type: Boolean,
        description: 'Set false to disable without deleting; inactive layouts are skipped during resolution.',
    })
    @IsBoolean()
    @Column({ default: true })
    isActive: boolean;

    @ApiProperty({ type: Date, readOnly: true })
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty({ type: Date, readOnly: true })
    @UpdateDateColumn()
    updatedAt: Date;
}

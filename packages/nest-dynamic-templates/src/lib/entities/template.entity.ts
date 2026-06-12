import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BaseEntity } from 'typeorm';
import { TemplateEngineEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


@Entity('nest_dynamic_templates')
@Index(['name', 'scope', 'scopeId', 'locale'], { unique: true })
export class NestDynamicTemplate extends BaseEntity {

    @ApiProperty({ type: String, format: 'uuid', readOnly: true, description: 'Primary key.' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        type: String,
        example: 'welcome-email',
        description:
            'Stable identifier you render by (lowercase letters, numbers, "-" and "_"). Stays the same across scopes and locales.',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z0-9\-_]+$/, { message: 'Invalid template name format' })
    @Column()
    name: string;

    @ApiProperty({ type: String, nullable: true, description: 'Human-friendly label for admin UIs, e.g. "Welcome email".' })
    @IsString()
    @IsOptional()
    @Column({ nullable: true })
    displayName?: string;

    @ApiProperty({ type: String, nullable: true, description: 'Free-text notes about what this template is for.' })
    @IsString()
    @IsOptional()
    @Column({ type: 'text', nullable: true })
    description?: string;

    @ApiProperty({
        type: String,
        nullable: true,
        example: 'email',
        description: 'Free category for grouping/filtering, e.g. email, sms, push, pdf.',
    })
    @IsString()
    @IsOptional()
    @Column({ type: 'text', nullable: true })
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
        description: 'Output processor applied after interpolation: html, mjml, md, txt. Omit to skip post-processing.',
    })
    @IsEnum(TemplateLanguageEnum)
    @IsOptional()
    @Column({ type: 'text' })
    language?: TemplateLanguageEnum;

    @ApiProperty({
        type: String,
        nullable: true,
        description: 'Optional subject line (emails). Rendered with the engine, so it can use variables.',
    })
    @IsString()
    @IsOptional()
    @Column({ nullable: true })
    subject?: string;

    @ApiProperty({ type: String, description: "The template body, written in the chosen engine's syntax." })
    @IsString()
    @IsOptional()
    @Column('text')
    content: string;

    @ApiProperty({ type: String, nullable: true, description: 'Name of a layout to wrap this content in.' })
    @IsString()
    @IsOptional()
    @Column({ nullable: true })
    templateLayoutName?: string;

    @ApiProperty({
        type: String,
        nullable: true,
        default: 'system',
        description:
            'Who owns this version: "system" (shared default) or a custom owner kind like "tenant"/"user". Overrides fall back to the system template.',
    })
    @IsString()
    @Column({ nullable: true, default: 'system' })
    scope?: string;

    @ApiProperty({
        type: String,
        nullable: true,
        description: 'Which owner inside the scope (e.g. the tenant id). Leave empty for system templates.',
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
        description: 'Sample data used to preview the template (not applied during render).',
    })
    @IsOptional()
    @Column('simple-json', { nullable: true })
    previewContext?: Record<string, any>;

    @ApiProperty({
        type: Boolean,
        description: 'Set false to disable without deleting; inactive templates are skipped during resolution.',
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

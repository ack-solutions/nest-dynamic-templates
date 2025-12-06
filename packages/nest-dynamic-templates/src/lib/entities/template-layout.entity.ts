import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BaseEntity } from 'typeorm';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { TemplateEngineEnum, TemplateTypeEnum, TemplateLanguageEnum } from '../interfaces/template.types';
import { ApiProperty } from '@nestjs/swagger';


@Entity('nest_dynamic_template_layouts')
@Index(['name', 'scope', 'scopeId', 'locale'], { unique: true })
export class NestDynamicTemplateLayout extends BaseEntity {

    @ApiProperty({ type: String, format: 'uuid', readOnly: true })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z0-9\-_]+$/, { message: 'Invalid template name format' })
    @Column()
    name: string;

    @ApiProperty({ type: String, nullable: true })
    @IsString()
    @IsOptional()
    @Column({ nullable: true })
    displayName?: string;

    @ApiProperty({ type: String, nullable: true })
    @IsString()
    @IsOptional()
    @Column({ type: 'text', nullable: true })
    description?: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsOptional()
    @Column({ type: 'text' })
    type?: string;

    @ApiProperty({ enum: TemplateEngineEnum, type: String })
    @IsEnum(TemplateEngineEnum)
    @Column({
        type: 'text',
        enum: TemplateEngineEnum,
        default: TemplateEngineEnum.NUNJUCKS
    })
    engine: TemplateEngineEnum;

    @ApiProperty({ enum: TemplateLanguageEnum, type: String, nullable: true })
    @IsEnum(TemplateLanguageEnum)
    @IsOptional()
    @Column({ type: 'text' })
    language?: TemplateLanguageEnum;

    @ApiProperty({ type: String })
    @IsString()
    @IsOptional()
    @Column('text')
    content: string;

    @ApiProperty({ type: String, nullable: true })
    @IsString()
    @IsOptional()
    @Column({ nullable: true })
    templateLayoutName?: string;

    @ApiProperty({ type: String, nullable: true })
    @IsString()
    @Column({ nullable: true, default: 'system' })
    scope?: string;

    @ApiProperty({ type: String, nullable: true })
    @IsString()
    @Column({ nullable: true })
    scopeId?: string;

    @ApiProperty({ type: String, nullable: true })
    @IsString()
    @Column({ nullable: true, default: 'en' })
    locale?: string;

    @ApiProperty({ type: Object, nullable: true })
    @IsOptional()
    @Column('simple-json', { nullable: true })
    previewContext?: Record<string, any>;

    @ApiProperty({ type: Boolean })
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

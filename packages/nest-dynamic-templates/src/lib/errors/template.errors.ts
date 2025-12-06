import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

export class TemplateRenderError extends InternalServerErrorException {
    constructor(operation: string, originalError: Error, templateName?: string) {
        const message = templateName
            ? `Failed to render template '${templateName}' during ${operation}: ${originalError.message}`
            : `Failed to render content during ${operation}: ${originalError.message}`;

        super({
            message,
            error: 'TEMPLATE_RENDER_ERROR',
            operation,
            templateName,
            originalError: originalError.message,
        });
    }
}

export class TemplateEngineError extends InternalServerErrorException {
    constructor(engine: string, originalError: Error) {
        super({
            message: `Template engine '${engine}' failed to render content: ${originalError.message}`,
            error: 'TEMPLATE_ENGINE_ERROR',
            engine,
            originalError: originalError.message,
        });
    }
}

export class TemplateLanguageError extends InternalServerErrorException {
    constructor(language: string, originalError: Error) {
        super({
            message: `Language processor '${language}' failed to render content: ${originalError.message}`,
            error: 'TEMPLATE_LANGUAGE_ERROR',
            language,
            originalError: originalError.message,
        });
    }
}

export class TemplateLayoutError extends InternalServerErrorException {
    constructor(layoutName: string, originalError: Error) {
        super({
            message: `Template layout '${layoutName}' failed to render: ${originalError.message}`,
            error: 'TEMPLATE_LAYOUT_ERROR',
            layoutName,
            originalError: originalError.message,
        });
    }
}

export class TemplateContentError extends InternalServerErrorException {
    constructor(contentType: string, originalError: Error) {
        super({
            message: `Failed to process ${contentType} content: ${originalError.message}`,
            error: 'TEMPLATE_CONTENT_ERROR',
            contentType,
            originalError: originalError.message,
        });
    }
}

export class TemplateValidationError extends BadRequestException {
    constructor(field: string, value: any, reason: string) {
        super({
            message: `Template validation failed for field '${field}': ${reason}`,
            error: 'TEMPLATE_VALIDATION_ERROR',
            field,
            value,
            reason,
        });
    }
}

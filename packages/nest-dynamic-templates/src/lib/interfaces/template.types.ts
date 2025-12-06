export enum TemplateTypeEnum {
    EMAIL = 'email',
    SMS = 'sms',
    PUSH = 'push',
    PDF = 'pdf',
}

export enum TemplateEngineEnum {
    NUNJUCKS = 'njk',
    HANDLEBARS = 'hbs',
    EJS = 'ejs',
    PUG = 'pug',
}

export enum TemplateLanguageEnum {
    MJML = 'mjml',
    HTML = 'html',
    MARKDOWN = 'md',
    TEXT = 'txt',
}

export interface Scope {
    scope: string;
    id: string;
}


export abstract class LanguageEngine {

    static engineName: string;

    abstract render(content: string, data?: Record<string, any>): Promise<string>;

    abstract validate(content: string): Promise<boolean>;


}

import { TemplateEngineUnavailableError } from '../errors/template.errors';

/**
 * Lazily load an optional peer package. If it is not installed, throw a clear,
 * actionable error instead of a raw "Cannot find module". Keeping this lazy is
 * what makes the engine peer dependencies genuinely optional — you only need the
 * packages for the engines you actually enable.
 *
 * The package ships as CommonJS, so we prefer `require` (which works everywhere,
 * including under Jest's CJS runtime), and fall back to dynamic `import()` only
 * when `require` is unavailable (e.g. a pure-ESM build).
 */
export async function loadPeer<T = any>(
    pkg: string,
    engine: string,
    kind: 'template' | 'language',
): Promise<T> {
    try {
        if (typeof require === 'function') {
            return require(pkg) as T;
        }
        return (await import(pkg)) as T;
    } catch {
        throw new TemplateEngineUnavailableError({
            engine,
            kind,
            reason: 'not-installed',
            peerPackage: pkg,
        });
    }
}

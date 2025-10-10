export class Sanitizer {
    static doesStringContainSpecialChar(string: string): boolean {
        return string.match(/[^A-Za-z0-9_\-.]/) !== null
    }
}
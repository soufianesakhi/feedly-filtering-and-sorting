
export interface Initializer {
    loadScript(name: string);
}

declare var INITIALIZER: Initializer;
declare var BROWSER;
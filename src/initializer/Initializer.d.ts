
export interface Initializer {
    loadScript(name: string);
    getResourceURLs(): ResourceURLs;
}

export interface ResourceURLs {
    plusIconURL: string;
    eraseIconURL: string;
    closeIconURL: string;
    moveUpIconURL: string;
    moveDownIconURL: string;
    openInNewTabURL: string;
    extensionIconURL: string;
}

declare var INITIALIZER: Initializer;
declare var BROWSER;
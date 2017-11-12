/// <reference path="../_references.d.ts" />

import { Initializer, ResourceURLs } from "./Initializer";
import { injectScriptText } from "../Utils";

export class WebExtInitializer implements Initializer {
    browser: any;
    constructor() {
        if (typeof (chrome) != "undefined") {
            this.browser = chrome;
        } else {
            this.browser = browser;
        }
        try {
            this.browser.storage.local;
        } catch (e) {
            this.browser = browser;
        }
    }

    loadScript(name: string) {
        $.ajax({
            url: this.getURL(name),
            dataType: "text",
            async: false,
            success: (result) => {
                injectScriptText(result);
            },
            error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => {
                console.log(errorThrown);
            }
        });
    }

    getResourceURLs(): ResourceURLs {
        return {
            plusIconURL: this.getURL("images/plus.png"),
            eraseIconURL: this.getURL("images/erase.png"),
            closeIconURL: this.getURL("images/close.png"),
            moveUpIconURL: this.getURL("images/move-up.png"),
            moveDownIconURL: this.getURL("images/move-down.png"),
            openInNewTabURL: this.getURL("images/open-in-new-tab.png"),
            extensionIconURL: this.getURL("icons/128.png")
        }
    }

    getURL(name: string) {
        return this.browser.extension.getURL(name);
    }

}

var INITIALIZER = new WebExtInitializer();
var BROWSER = INITIALIZER.browser;

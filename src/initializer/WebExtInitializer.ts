/// <reference path="../_references.d.ts" />

import { Initializer } from "./Initializer";
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
            url: this.browser.extension.getURL(name),
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

}

var INITIALIZER = new WebExtInitializer();
var BROWSER = INITIALIZER.browser;

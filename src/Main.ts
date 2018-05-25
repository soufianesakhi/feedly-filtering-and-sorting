/// <reference path="./_references.d.ts" />

import { UIManager } from "./UIManager";
import { bindMarkup, callbackBindedTo, injectStyleText } from "./Utils";
import { INITIALIZER } from "./initializer/Initializer";

var DEBUG = false;

function initResources() {
    INITIALIZER.loadScript("jquery.min.js");
    INITIALIZER.loadScript("node-creation-observer.js");
    let urls = INITIALIZER.getResourceURLs();
    ext.plusIconLink = urls.plusIconURL;
    ext.eraseIconLink = urls.eraseIconURL;
    ext.closeIconLink = urls.closeIconURL;
    ext.moveUpIconLink = urls.moveUpIconURL;
    ext.moveDownIconLink = urls.moveDownIconURL;
    templates.styleCSS = bindMarkup(templates.styleCSS, [
        { name: "open-in-new-tab-url", value: urls.openInNewTabURL },
        { name: "extension-icon", value: urls.extensionIconURL },
    ]);
    injectStyleText(templates.styleCSS);
}

$(document).ready(function () {
    try {
        initResources();
        var uiManager = new UIManager();
        var uiManagerBind = callbackBindedTo(uiManager);

        NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, function () {
            console.log("Feedly page fully loaded");
            uiManager.init().then(() => {
                NodeCreationObserver.onCreation(ext.articleSelector, uiManagerBind(uiManager.addArticle));
                NodeCreationObserver.onCreation(ext.sectionSelector, uiManagerBind(uiManager.addSection));
                NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, uiManagerBind(uiManager.updatePage));
            }, this);
        }, true);
    } catch (e) {
        console.log(e);
    }
});

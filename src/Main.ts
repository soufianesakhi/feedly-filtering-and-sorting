/// <reference path="./_references.d.ts" />

import { UIManager } from "./UIManager";
import { callbackBindedTo, injectStyleText } from "./Utils";
import { FeedlyPage } from "./FeedlyPage";
import { LocalStorage } from "./dao/LocalStorage";
import { INITIALIZER } from "./initializer/Initializer";

var DEBUG = false;

$(document).ready(function () {
    try {
        INITIALIZER.loadScript("jquery.min.js");
        INITIALIZER.loadScript("node-creation-observer.js");
        injectStyleText(templates.styleCSS);
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

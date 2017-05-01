/// <reference path="./_references.d.ts" />

import { UIManager } from "./UIManager";
import { callbackBindedTo, injectStyleText } from "./Utils";
import { FeedlyPage } from "./FeedlyPage";
import { LocalStorage } from "./dao/LocalStorage";

var DEBUG = false;
declare var LocalPersistence: LocalStorage;

function injectResources() {
    injectStyleText(templates.styleCSS);
    LocalPersistence.loadScript("jquery.min.js");
    LocalPersistence.loadScript("node-creation-observer.js");
    LocalPersistence.loadScript("jscolor.js");
}

$(document).ready(function () {
    injectResources();
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
});

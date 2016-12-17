/// <reference path="./_references.d.ts" />

import { UIManager } from "./UIManager";
import { callbackBindedTo } from "./Utils";
import { FeedlyPage } from "./FeedlyPage";

function injectResources() {
    $("head").append("<style>" + templates.styleCSS + "</style>");
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.src = "//code.jquery.com/jquery.min.js";
    head.appendChild(script);
}

$(document).ready(function () {
    var uiManager = new UIManager();
    var uiManagerBind = callbackBindedTo(uiManager);
    injectResources();

    NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, function () {
        console.log("Feedly page fully loaded");
        uiManager.init().then(() => {
            NodeCreationObserver.onCreation(ext.articleSelector, uiManagerBind(uiManager.addArticle));
            NodeCreationObserver.onCreation(ext.sectionSelector, uiManagerBind(uiManager.addSection));
            NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, uiManagerBind(uiManager.updatePage));
        }, this);
    }, true);
});

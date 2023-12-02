/// <reference path="./_references.d.ts" />

import { INITIALIZER } from "./initializer/Initializer";
import { UIManager } from "./UIManager";
import { bindMarkup, callbackBindedTo, injectStyleText } from "./Utils";

export var debugEnabled = localStorage.getItem("debug_enabled") === "true";
export function enableDebug(enabled = true) {
  localStorage.setItem("debug_enabled", "" + enabled);
}

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
    { name: "disable-all-filters-url", value: urls.clearFiltersURL },
    { name: "extension-icon", value: urls.extensionIconURL },
  ]);
  injectStyleText(templates.styleCSS);
}

$(document).ready(function () {
  try {
    initResources();
    var uiManager = new UIManager();
    var uiManagerBind = callbackBindedTo(uiManager);

    NodeCreationObserver.onCreation(
      ext.subscriptionChangeSelector,
      function () {
        console.log("Feedly page fully loaded");
        uiManager.init().then(() => {
          NodeCreationObserver.onCreation(
            ext.articleSelector,
            uiManagerBind(uiManager.addArticle)
          );
          NodeCreationObserver.onCreation(
            ext.subscriptionChangeSelector,
            uiManagerBind(uiManager.updatePage)
          );
        }, this);
      },
      true
    );
  } catch (e) {
    console.log(e);
  }
});

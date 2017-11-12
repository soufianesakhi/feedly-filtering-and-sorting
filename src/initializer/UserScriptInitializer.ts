import { Initializer } from "./Initializer";
import { injectScriptText } from "../Utils";

export class UserScriptInitializer implements Initializer {

    loadScript(name: string) {
        injectScriptText(GM_getResourceText(name));
    }
}

var INITIALIZER = new UserScriptInitializer();

import { Initializer, ResourceURLs } from "./Initializer";
import { injectScriptText } from "../Utils";

export class UserScriptInitializer implements Initializer {
    loadScript(name: string) {
        injectScriptText(GM_getResourceText(name));
    }

    getResourceURLs(): ResourceURLs {
        return {
            plusIconURL: "https://cdn0.iconfinder.com/data/icons/social-messaging-ui-color-shapes/128/add-circle-blue-128.png",
            eraseIconURL: "https://cdn2.iconfinder.com/data/icons/large-glossy-svg-icons/512/erase_delete_remove_wipe_out-128.png",
            closeIconURL: "https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/close-cancel-128.png",
            moveUpIconURL: "https://cdn2.iconfinder.com/data/icons/designers-and-developers-icon-set/32/move_up-32.png",
            moveDownIconURL: "https://cdn2.iconfinder.com/data/icons/designers-and-developers-icon-set/32/move_down-32.png",
            openInNewTabURL: "http://findicons.com/files/icons/2315/default_icon/256/open_in_new_window.png",
            extensionIconURL: "https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/web-ext/icons/128.png"
        }
    }
}

var INITIALIZER = new UserScriptInitializer();

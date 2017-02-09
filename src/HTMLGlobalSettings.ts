/// <reference path="./_references.d.ts" />

import { UIManager } from "./UIManager"
import { $id, setChecked, isChecked } from "./Utils";
import { LocalStorage } from "./dao/LocalStorage";
import { AsyncResult } from "./AsyncResult";

declare var LocalPersistence: LocalStorage;

export class GlobalSettingsCheckBox {
    id: string;
    htmlId: string;
    uiManager: UIManager;
    enabled: boolean;
    fullRefreshOnChange: boolean;
    sessionStoreEnabled: boolean;

    constructor(id: string, uiManager: UIManager, fullRefreshOnChange?: boolean, sessionStore?: boolean) {
        this.id = id;
        this.uiManager = uiManager;
        this.htmlId = uiManager.getHTMLId(id);
        this.fullRefreshOnChange = fullRefreshOnChange != null ? fullRefreshOnChange : true;
        this.sessionStoreEnabled = sessionStore != null ? sessionStore : false;
    }

    init(): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            LocalPersistence.getAsync(this.id, true).then((enabled) => {
                this.enabled = enabled;
                setChecked(this.htmlId, this.enabled);
                this.sessionStore();
                p.done();
            }, this);
        }, this);
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    setEnabled(enabled: boolean) {
        LocalPersistence.put(this.id, enabled);
        this.enabled = enabled;
        this.refreshUI();
        this.sessionStore();
    }

    sessionStore() {
        if (this.sessionStoreEnabled) {
            this.uiManager.page.put(this.id, this.enabled, true);
        }
    }

    initUI() {
        var this_ = this;
        $id(this.htmlId).click(function () {
            this_.setEnabled(isChecked($(this)));
            if (this_.fullRefreshOnChange) {
                this_.uiManager.refreshPage();
            }
        });
        this.refreshUI();
    }

    refreshUI() {
        setChecked(this.htmlId, this.enabled);
    }

}
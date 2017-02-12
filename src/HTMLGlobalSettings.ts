/// <reference path="./_references.d.ts" />

import { UIManager } from "./UIManager"
import { $id, setChecked, isChecked } from "./Utils";
import { LocalStorage } from "./dao/LocalStorage";
import { AsyncResult } from "./AsyncResult";

declare var LocalPersistence: LocalStorage;

export class GlobalSettingsCheckBox<T extends boolean | number> {
    id: string;
    htmlId: string;
    uiManager: UIManager;
    value: T;
    isBoolean: boolean;
    fullRefreshOnChange: boolean;
    sessionStoreEnabled: boolean;

    constructor(id: string, uiManager: UIManager, fullRefreshOnChange?: boolean, sessionStore?: boolean) {
        this.id = id;
        this.uiManager = uiManager;
        this.htmlId = uiManager.getHTMLId(id);
        this.fullRefreshOnChange = fullRefreshOnChange != null ? fullRefreshOnChange : true;
        this.sessionStoreEnabled = sessionStore != null ? sessionStore : false;
    }

    init(defaultValue: T): AsyncResult<any> {
        this.isBoolean = typeof (defaultValue) === "boolean";
        return new AsyncResult<any>((p) => {
            LocalPersistence.getAsync(this.id, defaultValue).then((value) => {
                this.setValue(value);
                p.done();
            }, this);
        }, this);
    }

    getValue(): T {
        return this.value;
    }

    setValue(value: T) {
        this.value = value;
        this.sessionStore();
    }

    save() {
        LocalPersistence.put(this.id, this.value);
    }

    sessionStore() {
        if (this.sessionStoreEnabled) {
            this.uiManager.page.put(this.id, this.value, true);
        }
    }

    getHTMLValue(e: JQuery): any {
        if (this.isBoolean) {
            return isChecked(e);
        } else {
            return Number(e.val());
        }
    }

    refreshHTMLValue() {
        if (this.isBoolean) {
            setChecked(this.htmlId, <boolean>this.value);
        } else {
            return $id(this.htmlId).val(<number>this.value);
        }
    }

    initUI(callback?: (newValue: boolean) => void, thisArg?: any) {
        var this_ = this;
        let applyCallback = () => {
            if (callback) {
                callback.call(thisArg, this_.value);
            }
        }
        $id(this.htmlId).click(function () {
            let val = this_.getHTMLValue($(this));
            this_.setValue(val);
            this_.save();
            if (this_.fullRefreshOnChange) {
                this_.uiManager.refreshPage();
            }
            applyCallback();
        });
        this.refreshHTMLValue();
        applyCallback();
    }

}
/// <reference path="../_references.d.ts" />

import { LocalStorage } from "./LocalStorage";
import { AsyncResult } from "../AsyncResult";
import { injectScriptText } from "../Utils";

export class UserScriptStorage implements LocalStorage {

    public getAsync<t>(id: string, defaultValue: t): AsyncResult<t> {
        return new AsyncResult<t>((p) => {
            p.result(JSON.parse(GM_getValue(id, JSON.stringify(defaultValue))));
        }, this);
    }

    public getItemsAsync<t>(ids: string[]): AsyncResult<t[]> {
        return new AsyncResult<t[]>((p) => {
            let results: t[] = [];
            ids.forEach((id) => {
                let value = GM_getValue(id, null);
                if (value != null) {
                    results.push(JSON.parse(value));
                }
            });
            p.result(results);
        }, this);
    }

    public put(id: string, value: any) {
        GM_setValue(id, JSON.stringify(value));
    }

    public delete(id: string) {
        GM_deleteValue(id);
    }

    public listKeys(): string[] {
        return GM_listValues();
    }

    public init(): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            p.done();
        }, this);
    }

    loadScript(name: string) {
        injectScriptText(GM_getResourceText(name));
    }

}

var LocalPersistence = new UserScriptStorage();
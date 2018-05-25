/// <reference path="../_references.d.ts" />

import { AsyncResult } from "../AsyncResult";
import { StorageManager, SyncStorageManager } from "./Storage";

export class UserScriptStorage implements StorageManager {
    public getAsync<t>(id: string, defaultValue: t): AsyncResult<t> {
        return new AsyncResult<t>((p) => {
            p.result(JSON.parse(GM_getValue(id, JSON.stringify(defaultValue))));
        }, this);
    }

    public getItemsAsync<t>(ids: string[]): AsyncResult<{ [key: string]: t }> {
        return new AsyncResult<{ [key: string]: t }>((p) => {
            let results = {};
            ids.forEach((id) => {
                let value = GM_getValue(id, null);
                if (value != null) {
                    results[id] = JSON.parse(value);
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

    getSyncStorageManager(): SyncStorageManager {
        return null;
    }

    getLocalStorage() {
        return this;
    }
}

var DataStore = new UserScriptStorage();

/// <reference path="../_references.d.ts" />

import { LocalStorage } from "./LocalStorage";

export class UserScriptStorage implements LocalStorage {

    public getAsync<t>(id: string, defaultValue: t, callback: (data: t) => void, thisArg): void {
        var data = JSON.parse(GM_getValue(id, JSON.stringify(defaultValue)));
        callback.call(thisArg, data);
    }

    public put(id: string, value: any, replace?: (key: string, value: any) => any) {
        GM_setValue(id, JSON.stringify(value, replace));
    }

    public delete(id: string) {
        GM_deleteValue(id);
    }
}

var LocalPersistence = new UserScriptStorage();
/// <reference path="../_references.d.ts" />

import { LocalStorage } from "./LocalStorage";
import { AsyncResult } from "../AsyncResult";

export class UserScriptStorage implements LocalStorage {

    public getAsync<t>(id: string, defaultValue: t): AsyncResult<t> {
        return new AsyncResult<t>((p) => {
            p.result(JSON.parse(GM_getValue(id, JSON.stringify(defaultValue))));
        }, this);
    }

    public put(id: string, value: any, replace?: (key: string, value: any) => any) {
        GM_setValue(id, JSON.stringify(value, replace));
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

}

var LocalPersistence = new UserScriptStorage();
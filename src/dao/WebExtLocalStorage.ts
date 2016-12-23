/// <reference path="../_references.d.ts" />

import { LocalStorage, LocalStorageArea } from "./LocalStorage";
import { AsyncResult } from "../AsyncResult";

export class WebExtLocalStorage implements LocalStorage {

    storage: LocalStorageArea = browser.storage.local;
    keys: string[] = [];

    onError = function (e) {
        throw e;
    }

    onSave = function () {
        if (DEBUG) {
            console.log("Storage save success");
        }
    }

    public getAsync<t>(id: string, defaultValue: t): AsyncResult<t> {
        return new AsyncResult<t>((p) => {
            this.storage.get(id).then((result) => {
                var data = result[id];
                if (data == null) {
                    data = defaultValue;
                }
                p.result(data);
            }, this.onError);
        }, this);
    }

    public put(id: string, value: any, replace?: (key: string, value: any) => any) {
        if (this.keys.indexOf(id) == -1) {
            this.keys.push(id);
        }
        var toStore = {};
        toStore[id] = value;
        this.storage.set(toStore).then(this.onSave, this.onError);
    }

    public delete(id: string) {
        var i = this.keys.indexOf(id);
        if (i > -1) {
            this.keys.splice(i, 1);
        }
        this.storage.remove(id).then(this.onSave, this.onError);
    }

    public listKeys(): string[] {
        return this.keys;
    }

    public init(): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            var keys = this.keys;
            this.storage.get(null).then((result) => {
                keys.concat(Object.keys(result));
                console.log("Stored keys: " + keys);
                p.done();
            }, (e) => {
                throw e;
            });
        }, this);
    }
}

var LocalPersistence = new WebExtLocalStorage();
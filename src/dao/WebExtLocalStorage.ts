/// <reference path="../_references.d.ts" />

import { LocalStorage, LocalStorageArea } from "./LocalStorage";

export class WebExtLocalStorage implements LocalStorage {

    storage: LocalStorageArea = browser.storage.local;

    onError = function (error) {
        console.log("Error: " + error);
    }

    public getAsync<t>(id: string, defaultValue: t, callback: (data: t) => void, thisArg): void {
        this.storage.get(id).then((result) => {
            var data = result[id];
            if (data == null) {
                data = defaultValue;
            }
            callback.call(thisArg, data);
        }, (error) => {
            console.log("Error: " + error);
            callback.call(thisArg, defaultValue);
        });
    }

    public put(id: string, value: any, replace?: (key: string, value: any) => any) {
        this.storage.set({ id: value }).then(null, this.onError);
    }

    public delete(id: string) {
        this.storage.remove(id).then(null, this.onError);
    }
}

var Storage = new WebExtLocalStorage();
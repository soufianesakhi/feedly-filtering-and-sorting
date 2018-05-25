/// <reference path="../_references.d.ts" />

import { AsyncResult } from "../AsyncResult";
import { BROWSER } from "../initializer/Initializer";
import { PromiseStorageArea, StorageArea, StorageManager, SyncStorageManager } from "./Storage";

var isArrayStorageMode = false;
class DefaultStorageAdapter {
    private storage: Storage;
    getStorage() {
        return this.storage;
    }
    setStorage(storage: Storage) {
        this.storage = storage;
    }
    public getAsync<t>(id: string, defaultValue: t): AsyncResult<t> {
        return new AsyncResult<t>((p) => {
            var isArr = isArrayStorageMode;
            var callback = (result) => {
                var data = (isArr ? result[0] : result)[id];
                if (data == null) {
                    data = defaultValue;
                }
                p.result(data);
            };
            this.storage.get(id, callback);
        }, this);
    }

    public getItemsAsync<t>(ids: string[]): AsyncResult<{ [key: string]: t }> {
        return new AsyncResult<{ [key: string]: t }>((p) => {
            var isArr = isArrayStorageMode;
            var callback = (result) => {
                let data = isArr ? result[0] : result;
                p.result(data);
            };
            this.storage.get(ids, callback);
        }, this);
    }

    public put(id: string, value: any) {
        var toStore = {};
        toStore[id] = value;
        this.storage.set(toStore);
    }

    public delete(id: string) {
        this.storage.remove(id);
    }
}

export class WebExtStorage implements StorageManager {
    storageAdapter = new DefaultStorageAdapter();
    localStorage: Storage;
    syncStorage: Storage;
    browser;
    keys: string[] = [];
    useSyncStorageId = "USE_SYNC_STORAGE";
    syncStorageEnabled: boolean;

    constructor() {
        this.browser = BROWSER;
    }

    onError = function (e) {
        throw e;
    }

    onSave = function () {
        if (DEBUG) {
            console.log("Storage save success");
        }
    }

    public getAsync<t>(id: string, defaultValue: t): AsyncResult<t> {
        return this.storageAdapter.getAsync(id, defaultValue);
    }

    public getItemsAsync<t>(ids: string[]): AsyncResult<{ [key: string]: t }> {
        return this.storageAdapter.getItemsAsync(ids);
    }

    public put(id: string, value: any) {
        if (this.keys.indexOf(id) == -1) {
            this.keys.push(id);
        }
        this.storageAdapter.put(id, value);
    }

    public delete(id: string) {
        var i = this.keys.indexOf(id);
        if (i > -1) {
            this.keys.splice(i, 1);
        }
        this.storageAdapter.delete(id);
    }

    public listKeys(): string[] {
        return this.keys;
    }

    getLocalStorageArea() {
        return this.browser.storage.local;
    }

    getSyncStorageArea() {
        return this.browser.storage.sync;
    }

    private initStorage() {
        return new AsyncResult<any>((p) => {
            var callback = (result) => {
                if ($.isArray(result)) {
                    isArrayStorageMode = true;
                }
                let enabled = (isArrayStorageMode ? result[0] : result)[this.useSyncStorageId];
                this.setSyncEnabled(enabled);
                p.done();
            };
            try { // Check if the browser supports promises
                this.setUpStorages(() => new PromiseStorage(this));
                this.getSyncStorageArea().get(this.useSyncStorageId).then(callback, (e) => {
                    throw e;
                });
            } catch (e) {
                this.setUpStorages(() => new DefaultStorage(this));
                this.syncStorage.get(this.useSyncStorageId, callback);
            }
        }, this);
    }

    setUpStorages(newInstance: () => Storage) {
        this.localStorage = newInstance();
        this.syncStorage = newInstance();
        this.syncStorage.setStorageArea(this.getSyncStorageArea());
        this.localStorage.setStorageArea(this.getLocalStorageArea());
    }

    public init(): AsyncResult<any> {
        return new AsyncResult<any>((p) => {
            this.initStorage().then(() => {
                var callback = (result) => {
                    this.keys = this.keys.concat(Object.keys(isArrayStorageMode ? result[0] : result));
                    p.done();
                };
                this.storageAdapter.getStorage().get(null, callback);
            }, this);
        }, this);
    }

    setSyncEnabled(enabled: boolean) {
        this.syncStorageEnabled = enabled;
        this.storageAdapter.setStorage(enabled ? this.syncStorage : this.localStorage);
    }

    getSyncStorageManager(): SyncStorageManager {
        let _this = this;
        return {
            isSyncEnabled(): boolean {
                return _this.syncStorageEnabled;
            },
            setSyncEnabled(enabled: boolean) {
                _this.setSyncEnabled(enabled);
                let toSave = {};
                toSave[_this.useSyncStorageId] = enabled;
                _this.syncStorage.set(toSave, () => {
                    console.log("Sync storage " + (enabled ? "enabled" : "disabled"));
                });
            }
        }
    }

    getLocalStorage() {
        let localStorageAdapter = new DefaultStorageAdapter();
        localStorageAdapter.setStorage(this.localStorage);
        return localStorageAdapter;
    }
}

abstract class Storage implements StorageArea {
    constructor(public webExt: WebExtStorage) { }
    abstract set(items: Object, callback?: (items: Object) => void): void;
    abstract remove(keys: string | string[], callback?: (items: Object) => void): void;
    abstract get(key: string | string[], callback: (items: Object) => void): void;
    abstract setStorageArea(storageArea: any);
}

class DefaultStorage extends Storage {
    area: StorageArea;
    set(items: Object, callback?: (items: Object) => void) {
        this.area.set(items);
    }
    remove(keys: string | string[], callback?: (items: Object) => void) {
        this.area.remove(keys);
    }
    get(key: string | string[], callback: (items: Object) => void) {
        this.area.get(key, callback);
    }
    setStorageArea(area) {
        this.area = area;
    }
}

class PromiseStorage extends Storage {
    area: PromiseStorageArea;
    set(items: Object, callback?: (items: Object) => void) {
        this.area.set(items).then(this.webExt.onSave, this.webExt.onError);
    }
    remove(keys: string | string[], callback?: (items: Object) => void) {
        this.area.remove(keys).then(this.webExt.onSave, this.webExt.onError);
    }
    get(key: string | string[], callback: (items: Object) => void) {
        this.area.get(key).then(callback, this.webExt.onError);
    }
    setStorageArea(area) {
        this.area = area;
    }
}

var DataStore = new WebExtStorage();

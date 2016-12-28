/// <reference path="../_references.d.ts" />

import { AsyncResult } from "../AsyncResult";

export interface LocalStorage {
    getAsync<t>(id: string, defaultValue: t): AsyncResult<t>;
    put(id: string, value: any, replace?: (key: string, value: any) => any);
    delete(id: string);
    listKeys(): string[];
    init(): AsyncResult<any>;
    loadScript(name: string);
}

export interface PromiseLocalStorageArea {
    /**
     * Sets multiple items.
     * @param keys An object containing one or more key/value pairs to be stored in storage. If an item already exists, its value will be updated.
        Primitive values (such as numbers) and arrays will serialize as expected.
        Functions will be omitted.
        Dates, and Regexes will serialize using their String representation.
     */
    set(items: Object): PromiseLike<any>;
    /**
     * Removes one or more items from storage.
     */
    remove(keys: string | string[]): PromiseLike<any>;
    /**
     * Gets one or more items from storage. Pass in null to get the entire contents of storage.
     */
    get(key: string | string[]): PromiseLike<any>;
}

export interface LocalStorageArea {
    /**
     * Sets multiple items.
     * @param items An object which gives each key/value pair to update storage with.
     * Any other key/value pairs in storage will not be affected.
     * Primitive values such as numbers will serialize as expected.
     * Values with a typeof "object" and "function" will typically serialize to {},
     * with the exception of Array (serializes as expected), Date,
     * and Regex (serialize using their String representation).
     */
    set(items: Object, callback?: (items: Object) => void): void;
    /**
     * Removes one or more items from storage.
     */
    remove(keys: string | string[], callback?: (items: Object) => void): void;
    /**
     * Gets one or more items from storage. Pass in null to get the entire contents of storage.
     * @param callback Callback with storage items, or on failure (in which case runtime.lastError will be set). 
     */
    get(key: string | string[], callback: (items: Object) => void): void;
}

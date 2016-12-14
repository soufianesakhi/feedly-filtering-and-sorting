/// <reference path="../_references.d.ts" />

export interface LocalStorage {

    getAsync<t>(id: string, defaultValue: t, callback: (data: t) => void, thisArg): void;
    put(id: string, value: any, replace?: (key: string, value: any) => any);
    delete(id: string);
}

export interface LocalStorageArea {
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

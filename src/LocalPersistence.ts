/// <reference path="./_references.d.ts" />

export class LocalPersistence {

    public static getAsync<t>(id: string, defaultValue: t, callback: (data: t) => void, thisArg): void {
        var data = JSON.parse(GM_getValue(id, JSON.stringify(defaultValue)));
        callback.call(thisArg, data);
    }

    public static put(id: string, value: any, replace?: (key: string, value: any) => any) {
        GM_setValue(id, JSON.stringify(value, replace));
    }

    public static delete(id: string) {
        GM_deleteValue(id);
    }
}